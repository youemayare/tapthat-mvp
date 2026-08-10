import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { profiles, connections } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { ProfileView } from '@/app/n/[uid]/profile-view';
import { isMultiProfileEnabled } from '@/lib/feature-flags';
import { validate as isUuid } from 'uuid';
import { createClient } from '@/lib/supabase/server';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  if (!isMultiProfileEnabled()) return { title: 'TapThat' };

  const { slug } = await params;
  const isId = isUuid(slug);
  
  const profile = await db.query.profiles.findFirst({
    where: isId ? eq(profiles.id, slug) : eq(profiles.slug, slug),
  });

  if (!profile || !profile.isPublished) {
    return { title: 'TapThat - Profile Unavailable' };
  }

  const name = [profile.firstName, profile.lastName].filter(Boolean).join(' ');
  return {
    title: `${name} - ${profile.jobTitle ?? 'Professional Profile'}`,
    description: profile.bio ?? `Connect with ${name} on TapThat`,
    openGraph: {
      title: name,
      description: profile.jobTitle ?? '',
      images: profile.profilePhotoUrl ? [profile.profilePhotoUrl] : [],
    },
  };
}

/**
 * GET /p/[slug]
 *
 * Persistent profile URL. Always resolves to the same profile regardless of
 * which profile is currently active on any physical card. This is the URL
 * that gets stored in connections and shared by visitors.
 *
 * Rules:
 * - Only accessible when MULTI_PROFILE_ENABLED=true
 * - Profile must be published (isPublished=true)
 * - Archived profiles show a neutral unavailable page (not 404, not redirected)
 * - Never redirects to the card's current active profile
 */
export default async function PersistentProfilePage({ params }: Props) {
  if (!isMultiProfileEnabled()) {
    notFound();
  }

  const { slug } = await params;
  const isId = isUuid(slug);

  // Resolve viewer session server-side
  let viewerUserId: string | null = null;
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    viewerUserId = user?.id ?? null;
  } catch {
    // No session - public visitor
  }

  const profile = await db.query.profiles.findFirst({
    where: isId ? eq(profiles.id, slug) : eq(profiles.slug, slug),
  });

  if (!profile) {
    notFound();
  }

  // Archived profile: show a neutral state, never redirect
  if (profile.archivedAt) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center p-6 text-center">
        <div>
          <p className="text-4xl mb-4">📦</p>
          <h1 className="text-xl font-bold text-foreground mb-2">Profile Archived</h1>
          <p className="text-muted-foreground">
            This profile is no longer active. The owner may have another public profile.
          </p>
        </div>
      </main>
    );
  }

  // Unpublished: show a neutral state
  if (!profile.isPublished) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center p-6 text-center">
        <div>
          <p className="text-4xl mb-4">😔</p>
          <h1 className="text-xl font-bold text-foreground mb-2">Profile Not Published</h1>
          <p className="text-muted-foreground">This person hasn&apos;t published this profile yet.</p>
        </div>
      </main>
    );
  }

  // Check if viewer already saved this profile
  const isOwner = viewerUserId === profile.userId;
  let alreadySaved = false;

  if (viewerUserId && !isOwner) {
    try {
      const existing = await db.query.connections.findFirst({
        where: and(
          eq(connections.viewerUserId, viewerUserId),
          eq(connections.profileId, profile.id)
        ),
      });
      alreadySaved = !!existing;
    } catch {
      // Non-critical - default to false
    }
  }

  // Persistent profile view — no cardUid needed since this isn't tied to a physical tap
  // We pass a synthetic card "uid" based on slug so the tap endpoint has something to work with
  // But we don't log taps from direct /p/ visits (no cardUid → /api/tap won't match a card)
  return (
    <ProfileView
      profile={profile}
      cardUid=""
      viewerUserId={viewerUserId}
      isOwner={isOwner}
      alreadySaved={alreadySaved}
    />
  );
}

export const dynamic = 'force-dynamic';
