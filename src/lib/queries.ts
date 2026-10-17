import type { Metadata } from 'next';
import { db } from '@/lib/db';
import { profiles, users, cards } from '@/lib/db/schema';
import { desc, eq, or } from 'drizzle-orm';
import { unstable_cache } from 'next/cache';

// Explicit columns to minimize JSON payload size and reduce Supabase egress.
// We DO NOT select timestamps, internal IDs, or flags unused by the public view.
export const PROFILE_PUBLIC_COLS = {
  id: profiles.id,
  userId: profiles.userId,
  slug: profiles.slug,
  firstName: profiles.firstName,
  lastName: profiles.lastName,
  jobTitle: profiles.jobTitle,
  companyName: profiles.companyName,
  bio: profiles.bio,
  profilePhotoUrl: profiles.profilePhotoUrl,
  companyLogoUrl: profiles.companyLogoUrl,
  cvUrl: profiles.cvUrl,
  phone: profiles.phone,
  whatsapp: profiles.whatsapp,
  email: profiles.email,
  linkedinUrl: profiles.linkedinUrl,
  instagramUrl: profiles.instagramUrl,
  websiteUrl: profiles.websiteUrl,
  showPhone: profiles.showPhone,
  showWhatsapp: profiles.showWhatsapp,
  showEmail: profiles.showEmail,
  showLinkedin: profiles.showLinkedin,
  showInstagram: profiles.showInstagram,
  showWebsite: profiles.showWebsite,
  socialLinks: profiles.socialLinks,
  theme: profiles.theme,
  profileLayout: profiles.profileLayout,
  layoutBackgroundColor: profiles.layoutBackgroundColor,
  layoutBackgroundImageUrl: profiles.layoutBackgroundImageUrl,
  layoutFont: profiles.layoutFont,
  isPublished: profiles.isPublished,
  archivedAt: profiles.archivedAt,
};

import { getBaseUrl } from '@/lib/utils';

export function buildProfileMetadata(
  profile: {
    id?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    jobTitle?: string | null;
    companyName?: string | null;
    bio?: string | null;
    profilePhotoUrl?: string | null;
    companyLogoUrl?: string | null;
    isPublished?: boolean | null;
    archivedAt?: Date | null;
  } | null,
  canonicalPath?: string
): Metadata {
  if (!profile || !profile.isPublished || profile.archivedAt) {
    return {
      title: 'Tayz — Profile Unavailable',
      description: 'This profile is currently unavailable on Tayz.',
      robots: { index: false, follow: false },
    };
  }

  const baseUrl = getBaseUrl();
  const name = [profile.firstName, profile.lastName].filter(Boolean).join(' ') || 'Tayz Member';
  const roleParts = [profile.jobTitle, profile.companyName].filter(Boolean);
  const roleSubtitle =
    profile.jobTitle && profile.companyName
      ? `${profile.jobTitle} at ${profile.companyName}`
      : roleParts[0] || 'Professional Profile';

  const title = `${name} — ${roleSubtitle}`;
  const description =
    profile.bio?.trim() ||
    `Connect with ${name} (${roleSubtitle}) on Tayz — one tap to save contact details and exchange information.`;

  const rawImageUrl = profile.profilePhotoUrl || profile.companyLogoUrl || undefined;
  let ogImageUrl = rawImageUrl;
  if (rawImageUrl && profile.id) {
    const versionMatch = rawImageUrl.match(/([a-f0-9]{8,32})\.[a-z0-9]+$/i);
    const versionParam = versionMatch ? `?v=${versionMatch[1].slice(-8)}` : '';
    ogImageUrl = `${baseUrl}/api/og/profile/${profile.id}.jpg${versionParam}`;
  }

  return {
    title,
    description,
    openGraph: {
      type: 'profile',
      siteName: 'Tayz',
      title,
      description,
      ...(canonicalPath ? { url: `${baseUrl}${canonicalPath}` } : {}),
      images: ogImageUrl
        ? [
            {
              url: ogImageUrl,
              secureUrl: ogImageUrl,
              width: 600,
              height: 600,
              type: 'image/jpeg',
              alt: name,
            },
          ]
        : [],
    },
    twitter: {
      card: 'summary',
      title,
      description,
      images: ogImageUrl ? [ogImageUrl] : [],
    },
  };
}

// Caches the profile fetch for /p/[slug] at the Vercel Edge.
// TTL is 5 minutes (300 seconds), but can be busted instantly via revalidateTag('profile-${slugOrId}').
export const getCachedProfileBySlug = (slugOrId: string) => unstable_cache(
  async () => {
    const isId = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(slugOrId);
    
    const result = await db
      .select({
        ...PROFILE_PUBLIC_COLS,
        handle: users.handle,
      })
      .from(profiles)
      .leftJoin(users, eq(profiles.userId, users.id))
      .where(isId ? eq(profiles.id, slugOrId) : or(eq(profiles.slug, slugOrId), eq(users.handle, slugOrId)))
      .orderBy(desc(profiles.isDefault))
      .limit(1);
    
    return result[0] ?? null;
  },
  [`profile-${slugOrId}`],
  { revalidate: 300, tags: [`profile-${slugOrId}`] }
)();

// Caches the card & profile fetch for /n/[uid] at the Vercel Edge.
// TTL is 5 minutes. Busted via revalidateTag('card-${uid}').
export const getCachedCardAndProfile = (sanitizedUid: string) => unstable_cache(
  async () => {
    const result = await db
      .select({
        card: {
          id: cards.id,
          userId: cards.userId,
          cardUid: cards.cardUid,
          status: cards.status,
        },
        profile: PROFILE_PUBLIC_COLS,
        handle: users.handle,
      })
      .from(cards)
      .leftJoin(profiles, eq(cards.profileId, profiles.id))
      .leftJoin(users, eq(profiles.userId, users.id))
      .where(eq(cards.cardUid, sanitizedUid))
      .limit(1);

    return result[0] ?? null;
  },
  [`card-${sanitizedUid}`],
  { revalidate: 300, tags: [`card-${sanitizedUid}`] }
)();

