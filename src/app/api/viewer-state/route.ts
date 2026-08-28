import { type NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { connections } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

/**
 * GET /api/viewer-state?profileId=<uuid>
 *
 * Returns the current viewer's relationship with a profile:
 *   - isOwner: boolean  (viewer is the profile owner)
 *   - alreadySaved: boolean (viewer has saved this connection)
 *
 * Security properties:
 *   - Response is always Cache-Control: no-store (never cached publicly)
 *   - Anonymous visitors receive { isOwner: false, alreadySaved: false }
 *   - Users can only query their own relationship, not other users'
 *   - profileId must be a valid UUID — rejects arbitrary input
 *   - No viewer's session or auth state is included in any ISR-cached HTML
 *
 * This endpoint exists to separate viewer-specific state from the public
 * ISR-cached profile render. It is fetched client-side after hydration.
 */
export async function GET(request: NextRequest) {
  const profileId = request.nextUrl.searchParams.get('profileId');

  // Validate UUID format
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!profileId || !UUID_RE.test(profileId)) {
    return NextResponse.json(
      { isOwner: false, alreadySaved: false, isLoggedIn: false },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  }

  // Resolve viewer session
  let viewerUserId: string | null = null;
  let profileOwnerId: string | null = null;

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    viewerUserId = user?.id ?? null;
  } catch {
    // No session or auth error — anonymous visitor
  }

  if (!viewerUserId) {
    return NextResponse.json(
      { isOwner: false, alreadySaved: false, isLoggedIn: false },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  }

  // Fetch the profile's owner — minimal query, no personal fields
  try {
    const { profiles } = await import('@/lib/db/schema');
    const rows = await db
      .select({ userId: profiles.userId })
      .from(profiles)
      .where(eq(profiles.id, profileId))
      .limit(1);

    profileOwnerId = rows[0]?.userId ?? null;
  } catch {
    return NextResponse.json(
      { isOwner: false, alreadySaved: false, isLoggedIn: false },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  }

  const isOwner = viewerUserId === profileOwnerId;
  let alreadySaved = false;

  // Only check saved status for non-owners
  if (!isOwner && profileOwnerId) {
    try {
      const existing = await db.query.connections.findFirst({
        where: and(
          eq(connections.viewerUserId, viewerUserId),
          eq(connections.profileId, profileId)
        ),
      });
      alreadySaved = !!existing;
    } catch {
      // Non-critical — default to false
    }
  }

  return NextResponse.json(
    { isOwner, alreadySaved, isLoggedIn: !!viewerUserId },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}
