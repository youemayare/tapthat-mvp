import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { contactExchanges } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { createClient } from '@/lib/supabase/server';

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { note } = await req.json();

    const exchange = await db.query.contactExchanges.findFirst({
      where: and(
        eq(contactExchanges.id, params.id),
        eq(contactExchanges.recipientUserId, user.id)
      )
    });

    if (!exchange) {
      return NextResponse.json({ error: 'Not found or not authorized' }, { status: 404 });
    }

    await db.update(contactExchanges)
      .set({ 
        recipientNote: note,
        recipientNoteUpdatedAt: new Date()
      })
      .where(eq(contactExchanges.id, params.id));

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[Update Note Error]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
