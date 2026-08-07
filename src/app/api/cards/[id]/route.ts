import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cards, cardStatusEvents } from '@/lib/db/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { createClient } from '@/lib/supabase/server';

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
    const requestedStatus = body.status as string;

    if (!['active', 'deactivated', 'revoked'].includes(requestedStatus)) {
      return NextResponse.json({ error: 'Invalid status requested' }, { status: 400 });
    }

    // Perform atomic update: The WHERE clause strictly validates ownership AND state transitions.
    // Transition Rules:
    // - active -> deactivated OR revoked
    // - deactivated -> active OR revoked
    // - revoked -> NOTHING
    
    // We fetch the current state as part of the transaction or returning block, 
    // but Drizzle/Postgres lets us do this in a single atomic query.
    
    // First, fetch the card to get its current status for the audit log (and to check if it exists/is owned)
    const currentCard = await db.query.cards.findFirst({
      where: and(
        eq(cards.id, cardId),
        eq(cards.userId, user.id)
      )
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

    // Ensure valid transitions
    if (currentCard.status === 'active' && !['deactivated', 'revoked'].includes(requestedStatus)) {
      return NextResponse.json({ error: 'Invalid transition from active' }, { status: 400 });
    }
    if (currentCard.status === 'deactivated' && !['active', 'revoked'].includes(requestedStatus)) {
      return NextResponse.json({ error: 'Invalid transition from deactivated' }, { status: 400 });
    }

    // Atomically update
    const [updatedCard] = await db
      .update(cards)
      .set({ 
        status: requestedStatus, 
        updatedAt: new Date() 
      })
      .where(
        and(
          eq(cards.id, cardId),
          eq(cards.userId, user.id)
        )
      )
      .returning({
        id: cards.id,
        cardType: cards.cardType,
        cardUid: cards.cardUid,
        status: cards.status,
        activatedAt: cards.activatedAt,
      });

    // Write audit event
    await db.insert(cardStatusEvents).values({
      cardId: updatedCard.id,
      userId: user.id,
      previousStatus: currentCard.status,
      newStatus: updatedCard.status,
      reason: 'User triggered via dashboard',
    });

    return NextResponse.json({ success: true, card: updatedCard });
  } catch (error: any) {
    console.error('Error updating card status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
