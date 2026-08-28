import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { withRlsUser } from '@/lib/db/auth-wrapper';
import { connections, connectionNotes, profiles } from '@/lib/db/schema';
import { and, eq } from 'drizzle-orm';

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { users } = await import('@/lib/db/schema');
    await db.insert(users).values({
      id: user.id,
      email: user.email || '',
      fullName: user.user_metadata?.full_name ?? null,
      avatarUrl: user.user_metadata?.avatar_url ?? null,
    }).onConflictDoNothing();
  } catch {}

  return await withRlsUser(user, async (tx) => {
    const body = await req.json();
    const profileId = body.profileId;
    const note = body.note;
    
    if (!profileId || typeof profileId !== 'string') {
      return NextResponse.json({ error: 'profileId is required' }, { status: 400 });
    }

    const profile = await tx.query.profiles.findFirst({
      where: and(eq(profiles.id, profileId), eq(profiles.isPublished, true)),
    });

    if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    if (profile.userId === user.id) return NextResponse.json({ error: 'Cannot save your own profile' }, { status: 400 });

    try {
      const connectionRecord = await tx.query.connections.findFirst({
        where: and(eq(connections.viewerUserId, user.id), eq(connections.profileId, profileId))
      });
      
      const alreadySaved = !!connectionRecord;
      let connectionId = connectionRecord?.id;

      if (!connectionRecord) {
        const [inserted] = await tx.insert(connections).values({
          viewerUserId: user.id,
          profileId,
        }).returning({ id: connections.id });
        connectionId = inserted.id;
      }

      if (note && typeof note === 'string' && connectionId) {
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
      }

      return NextResponse.json({ success: true, alreadySaved }, { status: 201 });
    } catch (err: unknown) {
      console.error('[connections POST]', err);
      return NextResponse.json({ error: 'Failed to save connection' }, { status: 500 });
    }
  });
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const profileId = body.profileId;
  if (!profileId || typeof profileId !== 'string') return NextResponse.json({ error: 'profileId is required' }, { status: 400 });

  return await withRlsUser(user, async (tx) => {
    await tx
      .delete(connections)
      .where(and(eq(connections.viewerUserId, user.id), eq(connections.profileId, profileId)));
    return NextResponse.json({ success: true });
  });
}

