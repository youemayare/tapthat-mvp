import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { contactExchanges } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const exchangeId = params.id;
  
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
    await db.update(contactExchanges)
      .set({ status: 'rejected' })
      .where(eq(contactExchanges.id, exchangeId));

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[Reject Exchange]', err);
    return NextResponse.json({ error: 'Failed to reject exchange' }, { status: 500 });
  }
}
