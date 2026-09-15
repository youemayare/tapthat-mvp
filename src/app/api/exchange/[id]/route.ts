import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { contactExchanges } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export async function DELETE(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await props.params;

    const exchange = await db.query.contactExchanges.findFirst({
      where: and(
        eq(contactExchanges.id, id),
        eq(contactExchanges.recipientUserId, user.id)
      )
    });

    if (!exchange) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    await db.delete(contactExchanges).where(eq(contactExchanges.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Delete Exchange]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
