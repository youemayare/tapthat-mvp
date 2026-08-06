import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { connections, profiles } from '@/lib/db/schema';
import { and, eq } from 'drizzle-orm';

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { profileId } = await req.json();
  if (!profileId || typeof profileId !== 'string') {
    return NextResponse.json({ error: 'profileId is required' }, { status: 400 });
  }

  // Verify the profile exists and is published
  const profile = await db.query.profiles.findFirst({
    where: and(eq(profiles.id, profileId), eq(profiles.isPublished, true)),
  });

  if (!profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
  }

  // Prevent users from saving their own profile
  if (profile.userId === user.id) {
    return NextResponse.json({ error: 'Cannot save your own profile' }, { status: 400 });
  }

  try {
    await db.insert(connections).values({
      viewerUserId: user.id,
      profileId,
    });
    return NextResponse.json({ success: true }, { status: 201 });
  } catch (err: unknown) {
    // Unique constraint violation — already saved
    const e = err as { code?: string };
    if (e?.code === '23505') {
      return NextResponse.json({ success: true, alreadySaved: true }, { status: 200 });
    }
    console.error('[connections POST]', err);
    return NextResponse.json({ error: 'Failed to save connection' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { profileId } = await req.json();
  if (!profileId || typeof profileId !== 'string') {
    return NextResponse.json({ error: 'profileId is required' }, { status: 400 });
  }

  await db
    .delete(connections)
    .where(and(eq(connections.viewerUserId, user.id), eq(connections.profileId, profileId)));

  return NextResponse.json({ success: true });
}
