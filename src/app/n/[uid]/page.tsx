import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ClaimCard } from './claim-card';
import { ProfileView } from './profile-view';
import { getCachedCardAndProfile } from '@/lib/queries';

interface Props {
  params: Promise<{ uid: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { uid } = await params;
  const sanitizedUid = uid.toUpperCase();
  if (!/^[A-Z0-9-]{8,64}$/.test(sanitizedUid)) {
    return {
      title: 'Anoya — Claim Your Card',
      description: 'Set up your professional profile on Anoya.',
    };
  }

  try {
    const row = await getCachedCardAndProfile(sanitizedUid);
    
    // Revoked cards: completely dead, don't show any profile info
    if (row?.card.status === 'revoked') {
      return {
        title: 'Anoya — Card Unavailable',
        description: 'This card has been permanently revoked and is no longer usable.',
      };
    }

    // Deactivated cards: temporarily unavailable
    if (row?.card.status === 'deactivated') {
      return {
        title: 'Anoya — Card Unavailable',
        description: 'This card is temporarily unavailable.',
      };
    }

    if (row?.card.status === 'active' && row.profile) {
      const name = [row.profile.firstName, row.profile.lastName].filter(Boolean).join(' ');
      return {
        title: `${name} — ${row.profile.jobTitle ?? 'Professional Profile'}`,
        description: row.profile.bio ?? `Connect with ${name} on Anoya`,
        openGraph: {
          title: name,
          description: row.profile.jobTitle ?? '',
          images: row.profile.profilePhotoUrl ? [row.profile.profilePhotoUrl] : [],
        },
      };
    }
  } catch {
    // DB not connected during build — return default metadata
  }

  return {
    title: 'Anoya — Claim Your Card',
    description: 'Set up your professional profile on Anoya.',
  };
}

export default async function NfcTapPage({ params }: Props) {
  const { uid } = await params;

  // Sanitize: NFC UIDs are strings, uppercase, allow hyphens for test cards
  const sanitizedUid = uid.toUpperCase();
  if (!/^[A-Z0-9-]{8,64}$/.test(sanitizedUid)) {
    notFound();
  }

  // Look up the card via ISR-cached query
  let card = null;
  let profile = null;

  try {
    const row = await getCachedCardAndProfile(sanitizedUid);
    card = row?.card ?? null;
    profile = row?.profile ?? null;
  } catch {
    // DB not yet connected — fall through to claim page
  }

  // ── Claim flow: card not in DB or not yet activated ──
  if (!card || card.status === 'unclaimed') {
    return <ClaimCard uid={sanitizedUid} />;
  }

  // ── Revoked card ──
  if (card.status === 'revoked') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6 text-center">
        <div>
          <p className="text-4xl mb-4">🚫</p>
          <h1 className="text-xl font-bold text-foreground mb-2">Card Unavailable</h1>
          <p className="text-muted-foreground">This card has been permanently revoked and is no longer usable.</p>
        </div>
      </div>
    );
  }

  // ── Deactivated card ──
  if (card.status === 'deactivated') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6 text-center">
        <div>
          <p className="text-4xl mb-4">😴</p>
          <h1 className="text-xl font-bold text-foreground mb-2">Card Deactivated</h1>
          <p className="text-muted-foreground">This card has been deactivated by its owner.</p>
        </div>
      </div>
    );
  }

  // ── Active card but no profile linked yet ──
  if (!profile || !profile.isPublished) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6 text-center">
        <div>
          <p className="text-4xl mb-4">🚧</p>
          <h1 className="text-xl font-bold text-foreground mb-2">Profile Not Published</h1>
          <p className="text-muted-foreground">This person hasn&apos;t published their profile yet.</p>
        </div>
      </div>
    );
  }

  // ── Active card with published profile → show it ──
  // Viewer state (isOwner, alreadySaved) is NOT passed here.
  // It is fetched client-side by ProfileView via /api/viewer-state,
  // ensuring it is never present in ISR-cached HTML.
  return (
    <ProfileView
      profile={profile}
      cardUid={sanitizedUid}
    />
  );
}

// ISR: revalidate every 60 seconds. Individual cards are revalidated immediately
// on profile switch or status change via revalidateTag('card-{uid}').
export const revalidate = 60;
