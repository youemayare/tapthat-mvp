import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { profiles, contactExchanges, cards } from '@/lib/db/schema';
import { and, eq, isNull } from 'drizzle-orm';
import { z } from 'zod';
import { exchangeIpRatelimit, exchangeRecipientRatelimit, exchangeIpRecipientRatelimit } from '@/lib/ratelimit';

const loggedInExchangeSchema = z.object({
  targetProfileId: z.string().uuid(),
  sourceProfileId: z.string().uuid(),
  sourceCardUid: z.string().max(64).optional().nullable(),
});

export async function POST(req: NextRequest) {
  // 1. Rate limiting
  const ip = req.headers.get('x-forwarded-for') ?? '127.0.0.1';
  
  const { success: ipSuccess } = await exchangeIpRatelimit.limit(ip);
  if (!ipSuccess) return NextResponse.json({ error: 'Too many requests' }, { status: 429 });

  const body = await req.json();

  // Temporary for phase 1: only handling logged-in exchange
  if (body.type === 'manual') {
    return NextResponse.json({ error: 'Manual exchange not yet implemented' }, { status: 501 });
  }

  const parsed = loggedInExchangeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request data', details: parsed.error }, { status: 400 });
  }
  const data = parsed.data;

  // Additional rate limiting (recipient based)
  // Note: For recipient rate limiting, we use targetProfileId as the proxy for recipient user id here
  // before we've looked it up, just to prevent DB DoS.
  const { success: recipSuccess } = await exchangeRecipientRatelimit.limit(data.targetProfileId);
  if (!recipSuccess) return NextResponse.json({ error: 'Too many requests' }, { status: 429 });

  const { success: ipRecipSuccess } = await exchangeIpRecipientRatelimit.limit(`${ip}:${data.targetProfileId}`);
  if (!ipRecipSuccess) return NextResponse.json({ error: 'Too many requests' }, { status: 429 });

  // 2. Auth check
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 3. Resolve targetProfileId
  const targetProfile = await db.query.profiles.findFirst({
    where: and(
      eq(profiles.id, data.targetProfileId),
      eq(profiles.isPublished, true),
      isNull(profiles.archivedAt)
    )
  });

  if (!targetProfile) {
    return NextResponse.json({ error: 'Target profile not found' }, { status: 404 });
  }
  
  if (targetProfile.userId === user.id) {
    return NextResponse.json({ error: 'Cannot exchange with yourself' }, { status: 400 });
  }

  // 4. Logged-in branch logic
  // Verify ownership of sourceProfileId
  const sourceProfile = await db.query.profiles.findFirst({
    where: and(
      eq(profiles.id, data.sourceProfileId),
      eq(profiles.userId, user.id)
    )
  });

  if (!sourceProfile) {
    return NextResponse.json({ error: 'Source profile not found or not owned by user' }, { status: 403 });
  }

  // Derive source_channel
  let sourceChannel: 'nfc' | 'qr' | 'direct_link' | 'unknown' = 'unknown';
  if (data.sourceCardUid) {
    // Verify it belongs to recipient
    const card = await db.query.cards.findFirst({
      where: and(
        eq(cards.cardUid, data.sourceCardUid),
        eq(cards.userId, targetProfile.userId),
        eq(cards.status, 'active')
      )
    });
    if (card) {
      sourceChannel = 'nfc';
    } else {
      sourceChannel = 'direct_link'; // Default fallback if given invalid uid
    }
  } else {
    sourceChannel = 'direct_link'; // If no card uid provided
  }

  // Check if they are blocked
  const blockedCheck = await db.query.contactExchanges.findFirst({
    where: and(
      eq(contactExchanges.recipientUserId, targetProfile.userId),
      eq(contactExchanges.sourceUserId, user.id),
      eq(contactExchanges.status, 'blocked')
    )
  });

  if (blockedCheck) {
    // Silently succeed so as not to reveal blocked status
    return NextResponse.json({ success: true });
  }

  // Insert with source_type = 'tayz_profile'
  try {
    await db.insert(contactExchanges).values({
      recipientUserId: targetProfile.userId,
      recipientProfileId: targetProfile.id,
      sourceType: 'tayz_profile',
      sourceUserId: user.id,
      sourceProfileId: sourceProfile.id,
      sourceChannel,
      status: 'pending'
    });
  } catch (err: unknown) {
    // Catch unique constraint (23505) for duplicate pair
    if (typeof err === 'object' && err !== null && 'code' in err && (err as { code: string }).code === '23505') {
      // Already pending or accepted
      return NextResponse.json({ success: true });
    }
    console.error('[exchange POST]', err);
    return NextResponse.json({ error: 'Failed to create exchange' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
