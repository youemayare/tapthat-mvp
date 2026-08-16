import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ProfileView } from '@/app/n/[uid]/profile-view';
import { isMultiProfileEnabled } from '@/lib/feature-flags';
import { getCachedProfileBySlug } from '@/lib/queries';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  if (!isMultiProfileEnabled()) return { title: 'Anoya' };

  const { slug } = await params;
  const profile = await getCachedProfileBySlug(slug);

  if (!profile || !profile.isPublished) {
    return { title: 'Anoya - Profile Unavailable' };
  }

  const name = [profile.firstName, profile.lastName].filter(Boolean).join(' ');
  return {
    title: `${name} - ${profile.jobTitle ?? 'Professional Profile'}`,
    description: profile.bio ?? `Connect with ${name} on Anoya`,
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
 * which profile is currently active on any physical card.
 *
 * Rules:
 * - Only accessible when MULTI_PROFILE_ENABLED=true
 * - Profile must be published (isPublished=true)
 * - Archived profiles show a neutral unavailable page (not 404, not redirected)
 * - Never redirects to the card's current active profile
 *
 * Caching: ISR (revalidate=60). Viewer state (isOwner, alreadySaved) is NOT
 * included in server-rendered HTML — ProfileView fetches it client-side via
 * /api/viewer-state after hydration, so it never contaminates the public cache.
 */
export default async function PersistentProfilePage({ params }: Props) {
  if (!isMultiProfileEnabled()) {
    notFound();
  }

  const { slug } = await params;

  const profile = await getCachedProfileBySlug(slug);

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
          <p className="text-muted-foreground">This person has either drafted their profile or it hasn&apos;t been published yet.</p>
        </div>
      </main>
    );
  }

  // Persistent profile view — viewer state fetched client-side, not in cached HTML
  return (
    <ProfileView
      profile={profile}
      cardUid=""
    />
  );
}

// ISR: revalidate every 60 seconds. Profile edits invalidate via revalidateTag.
export const revalidate = 60;
