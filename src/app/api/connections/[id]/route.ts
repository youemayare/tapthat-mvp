import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { withRlsUser } from '@/lib/db/auth-wrapper';
import { connectionNotes } from '@/lib/db/schema';
import { and, eq } from 'drizzle-orm';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return await withRlsUser(user, async (tx) => {
    const body = await req.json();
    const { note } = body;
    const connectionId = params.id;

    try {
      if (typeof note === 'string') {
        // Upsert note
        await tx.insert(connectionNotes)
          .values({
            connectionId: connectionId,
            ownerUserId: user.id,
            content: note
          })
          .onConflictDoUpdate({
            target: [connectionNotes.connectionId, connectionNotes.ownerUserId],
            set: { content: note, updatedAt: new Date() }
          });
      } else if (note === null) {
        // Delete note
        await tx.delete(connectionNotes)
          .where(and(eq(connectionNotes.connectionId, connectionId), eq(connectionNotes.ownerUserId, user.id)));
      }
      return NextResponse.json({ success: true }, { status: 200 });
    } catch (err: unknown) {
      console.error('[connections PATCH]', err);
      return NextResponse.json({ error: 'Failed to update connection note' }, { status: 500 });
    }
  });
}
