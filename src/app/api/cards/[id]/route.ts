/**
 * PATCH /api/cards/[id]
 *
 * Handles two distinct operations via the request body:
 *
 * 1. Status change: { status: 'active' | 'deactivated' | 'revoked' }
 *    - Existing behavior, unchanged.
 *
 * 2. Profile switch (multi-profile only): { profileId: string }
 *    - Requires MULTI_PROFILE_ENABLED=true.
 *    - Validates ownership of both the card and the selected profile.
 *    - Profile must be published and not archived.
 *    - Card must not be revoked.
 *    - Writes an audit event to card_status_events.
 */
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withRlsUser, Transaction } from '@/lib/db/auth-wrapper';
import { cards, cardStatusEvents, profiles } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { createClient } from '@/lib/supabase/server';
import { isMultiProfileEnabled } from '@/lib/feature-flags';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: cardId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();

    // ── Branch: Profile switch ────────────────────────────────────────────────
    if ('profileId' in body) {
      if (!isMultiProfileEnabled()) {
        return NextResponse.json({ error: 'Feature not enabled' }, { status: 403 });
      }
      return await withRlsUser(user, (tx) => handleProfileSwitch(tx, cardId, body.profileId, user.id));
    }

    // ── Branch: Status change (existing behavior, unchanged) ──────────────────
    return await withRlsUser(user, (tx) => handleStatusChange(tx, cardId, body.status, user.id));
  } catch (error: unknown) {
    console.error('Error updating card:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ─── Status Change (original behavior, fully unchanged) ──────────────────────

async function handleStatusChange(tx: Transaction, cardId: string, requestedStatus: string, userId: string) {
  if (!['active', 'deactivated', 'revoked'].includes(requestedStatus)) {
    return NextResponse.json({ error: 'Invalid status requested' }, { status: 400 });
  }

  const currentCard = await tx.query.cards.findFirst({
    where: and(eq(cards.id, cardId), eq(cards.userId, userId)),
  });

  if (!currentCard) {
    return NextResponse.json({ error: 'Card not found or unauthorized' }, { status: 404 });
  }
  if (currentCard.status === 'revoked') {
    return NextResponse.json({ error: 'Card is permanently revoked and cannot be changed' }, { status: 403 });
  }
  if (currentCard.status === requestedStatus) {
    return NextResponse.json({ error: 'Card is already in this state' }, { status: 400 });
  }
  if (currentCard.status === 'active' && !['deactivated', 'revoked'].includes(requestedStatus)) {
    return NextResponse.json({ error: 'Invalid transition from active' }, { status: 400 });
  }
  if (currentCard.status === 'deactivated' && !['active', 'revoked'].includes(requestedStatus)) {
    return NextResponse.json({ error: 'Invalid transition from deactivated' }, { status: 400 });
  }

  const [updatedCard] = await tx
    .update(cards)
    .set({ status: requestedStatus, updatedAt: new Date() })
    .where(and(eq(cards.id, cardId), eq(cards.userId, userId)))
    .returning({
      id: cards.id,
      cardType: cards.cardType,
      cardUid: cards.cardUid,
      status: cards.status,
      activatedAt: cards.activatedAt,
    });

  // Use db.insert instead of tx.insert to bypass RLS for audit logging
  // (Production DB is missing the INSERT policy for card_status_events)
  try {
    await db.insert(cardStatusEvents).values({
      cardId: updatedCard.id,
      userId,
      previousStatus: currentCard.status,
      newStatus: updatedCard.status,
      reason: 'User triggered via dashboard',
    });
  } catch (error) {
    console.error('Failed to write audit log:', error);
  }

  return NextResponse.json({ success: true, card: updatedCard });
}

// ─── Profile Switch (multi-profile only) ─────────────────────────────────────

async function handleProfileSwitch(tx: Transaction, cardId: string, profileId: string, userId: string) {
  if (!profileId || typeof profileId !== 'string') {
    return NextResponse.json({ error: 'profileId is required' }, { status: 400 });
  }

  // Verify card ownership and that it's not revoked
  const currentCard = await tx.query.cards.findFirst({
    where: and(eq(cards.id, cardId), eq(cards.userId, userId)),
  });

  if (!currentCard) {
    return NextResponse.json({ error: 'Card not found or unauthorized' }, { status: 404 });
  }
  if (currentCard.status === 'revoked') {
    return NextResponse.json({ error: 'Cannot switch profile on a permanently revoked card' }, { status: 403 });
  }
  if (currentCard.profileId === profileId) {
    return NextResponse.json({ error: 'This profile is already active on this card' }, { status: 400 });
  }

  // Verify the selected profile is:
  // 1. Owned by the same user as the card
  // 2. Published (not a draft)
  // 3. Not archived
  const targetProfile = await tx.query.profiles.findFirst({
    where: and(eq(profiles.id, profileId), eq(profiles.userId, userId)),
  });

  if (!targetProfile) {
    return NextResponse.json({ error: 'Profile not found or does not belong to you' }, { status: 404 });
  }
  if (!targetProfile.isPublished) {
    return NextResponse.json({ error: 'Only published profiles can be made active on a card' }, { status: 400 });
  }
  if (targetProfile.archivedAt) {
    return NextResponse.json({ error: 'Archived profiles cannot be made active on a card' }, { status: 400 });
  }

  // Atomically update cards.profile_id — scoped to authenticated user ownership
  const [updatedCard] = await tx
    .update(cards)
    .set({ profileId, updatedAt: new Date() })
    .where(and(eq(cards.id, cardId), eq(cards.userId, userId)))
    .returning();

  // Use db.insert instead of tx.insert to bypass RLS for audit logging
  // (Production DB is missing the INSERT policy for card_status_events)
  try {
    await db.insert(cardStatusEvents).values({
      cardId: updatedCard.id,
      userId,
      previousStatus: currentCard.status,
      newStatus: currentCard.status, // Status itself doesn't change
      reason: 'Profile switched via dashboard',
      previousProfileId: currentCard.profileId,
      newProfileId: profileId,
    });
  } catch (error) {
    console.error('Failed to write audit log:', error);
  }

  return NextResponse.json({ success: true, card: updatedCard });
}
