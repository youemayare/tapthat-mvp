import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { cards, profiles, connections } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { ClaimCard } from './claim-card';
import { ProfileView } from './profile-view';
import { createClient } from '@/lib/supabase/server';

interface Props {
  params: Promise<{ uid: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { uid } = await params;
  const sanitizedUid = uid.toUpperCase();
  if (!/^[A-Z0-9-]{8,64}$/.test(sanitizedUid)) {
    return {
      title: 'TapThat — Claim Your Card',
      description: 'Set up your professional profile on TapThat.',
    };
  }

  try {
    const result = await db
      .select({ card: cards, profile: profiles })
      .from(cards)
      .leftJoin(profiles, eq(cards.profileId, profiles.id))
      .where(eq(cards.cardUid, sanitizedUid))
      .limit(1);

    const row = result[0];
    
    // Revoked cards: completely dead, don't show any profile info
    if (row?.card.status === 'revoked') {
      return {
        title: 'TapThat — Card Unavailable',
        description: 'This card has been permanently revoked and is no longer usable.',
      };
    }

    // Deactivated cards: temporarily unavailable
    if (row?.card.status === 'deactivated') {
      return {
        title: 'TapThat — Card Unavailable',
        description: 'This card is temporarily unavailable.',
      };
    }

    if (row?.card.status === 'active' && row.profile) {
      const name = [row.profile.firstName, row.profile.lastName].filter(Boolean).join(' ');
      return {
        title: `${name} — ${row.profile.jobTitle ?? 'Professional Profile'}`,
        description: row.profile.bio ?? `Connect with ${name} on TapThat`,
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
    title: 'TapThat — Claim Your Card',
    description: 'Set up your professional profile on TapThat.',
  };
}

export default async function NfcTapPage({ params }: Props) {
  const { uid } = await params;

  // Sanitize: NFC UIDs are strings, uppercase, allow hyphens for test cards
  const sanitizedUid = uid.toUpperCase();
  if (!/^[A-Z0-9-]{8,64}$/.test(sanitizedUid)) {
    notFound();
  }

  // Resolve viewer session server-side
  let viewerUserId: string | null = null;
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    viewerUserId = user?.id ?? null;
  } catch {
    // No session — public visitor
  }

  // Look up the card
  let card = null;
  let profile = null;

  try {
    const result = await db
      .select({ card: cards, profile: profiles })
      .from(cards)
      .leftJoin(profiles, eq(cards.profileId, profiles.id))
      .where(eq(cards.cardUid, sanitizedUid))
      .limit(1);

    const row = result[0];
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

  // ── Check if viewer already saved this profile ──
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
      // Non-critical — default to false
    }
  }

  // ── Active card with published profile → show it ──
  return (
    <ProfileView
      profile={profile}
      cardUid={sanitizedUid}
      viewerUserId={viewerUserId}
      isOwner={isOwner}
      alreadySaved={alreadySaved}
    />
  );
}

// Always render fresh so viewer session / isOwner is accurate per request
export const dynamic = 'force-dynamic';
