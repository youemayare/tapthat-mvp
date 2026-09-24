import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { contactExchanges, connections } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export async function POST(req: Request, props: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: exchangeId } = await props.params;
  
  const exchange = await db.query.contactExchanges.findFirst({
    where: and(
      eq(contactExchanges.id, exchangeId),
      eq(contactExchanges.recipientUserId, user.id)
    )
  });

  if (!exchange) {
    return NextResponse.json({ error: 'Not found or not authorized' }, { status: 404 });
  }

  if (exchange.status !== 'pending') {
    return NextResponse.json({ error: 'Exchange is not pending' }, { status: 400 });
  }

  try {
    await db.transaction(async (tx) => {
      // 1. Update status
      await tx.update(contactExchanges)
        .set({ status: 'accepted' })
        .where(eq(contactExchanges.id, exchangeId));

      // 2. If it's an tayz profile, add to connections
      if (exchange.sourceType === 'tayz_profile' && exchange.sourceProfileId) {
        await tx.insert(connections).values({
          viewerUserId: user.id,
          profileId: exchange.sourceProfileId
        }).onConflictDoNothing(); // Idempotent due to unique constraint
      }
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[Accept Exchange]', err);
    return NextResponse.json({ error: 'Failed to accept exchange' }, { status: 500 });
  }
}
