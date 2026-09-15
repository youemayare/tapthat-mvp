import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ProfileView } from '@/app/n/[uid]/profile-view';
import { getCachedProfileBySlug, PROFILE_PUBLIC_COLS } from '@/lib/queries';
import { db } from '@/lib/db';
import { profiles, users, cards } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

// Define reserved slugs to prevent conflicts with static routes
const RESERVED_SLUGS = new Set([
  'dashboard', 'login', 'signup', 'api', 'n', 'p', 'settings', 'auth', '_next', 'static'
]);

interface Props {
  params: Promise<{ handle: string }>;
  searchParams: Promise<{ tap?: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle } = await params;
  if (RESERVED_SLUGS.has(handle.toLowerCase())) return { title: 'Anoya' };

  const profile = await getCachedProfileBySlug(handle);

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

export default async function HandleProfilePage({ params, searchParams }: Props) {
  const { handle } = await params;
  const { tap } = await searchParams;

  if (RESERVED_SLUGS.has(handle.toLowerCase())) {
    notFound();
  }

  let profile = null;

  if (tap && typeof tap === 'string') {
    // If it's a tap, prioritize the profile linked to the card UID
    const sanitizedUid = tap.toUpperCase();
    const result = await db
      .select({
        profile: PROFILE_PUBLIC_COLS,
      })
      .from(profiles)
      .leftJoin(users, eq(profiles.userId, users.id))
      .innerJoin(cards, eq(cards.profileId, profiles.id))
      .where(and(
        eq(cards.cardUid, sanitizedUid),
        eq(users.handle, handle)
      ))
      .limit(1);

    if (result.length > 0) {
      profile = result[0].profile;
    }
  }

  // If no tap param or specific profile not found, fallback to default profile for the handle
  if (!profile) {
    const result = await db
      .select({ profile: PROFILE_PUBLIC_COLS })
      .from(profiles)
      .leftJoin(users, eq(profiles.userId, users.id))
      .where(and(
        eq(users.handle, handle),
        eq(profiles.isDefault, true)
      ))
      .limit(1);

    profile = result[0]?.profile ?? null;
  }

  // Final fallback: just get the first profile for this handle if none is marked default
  if (!profile) {
    profile = await getCachedProfileBySlug(handle);
  }

  if (!profile) {
    notFound();
  }

  // Archived profile
  if (profile.archivedAt) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center p-6 text-center">
        <div>
          <p className="text-4xl mb-4">dY"</p>
          <h1 className="text-xl font-bold text-foreground mb-2">Profile Archived</h1>
          <p className="text-muted-foreground">
            This profile is no longer active.
          </p>
        </div>
      </main>
    );
  }

  // Unpublished profile
  if (!profile.isPublished) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center p-6 text-center">
        <div>
          <p className="text-4xl mb-4">dY~"</p>
          <h1 className="text-xl font-bold text-foreground mb-2">Profile Not Published</h1>
          <p className="text-muted-foreground">This person has either drafted their profile or it hasn&apos;t been published yet.</p>
        </div>
      </main>
    );
  }

  return (
    <ProfileView
      profile={profile}
      cardUid={typeof tap === 'string' ? tap : ''}
    />
  );
}

export const dynamic = 'force-dynamic';
