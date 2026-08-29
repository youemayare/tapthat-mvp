import { db } from '@/lib/db';
import { profiles, cards } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
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
  socialLinks: profiles.socialLinks,
  theme: profiles.theme,
  profileLayout: profiles.profileLayout,
  layoutBackgroundColor: profiles.layoutBackgroundColor,
  layoutBackgroundImageUrl: profiles.layoutBackgroundImageUrl,
  layoutFont: profiles.layoutFont,
  isPublished: profiles.isPublished,
  archivedAt: profiles.archivedAt,
};

// Caches the profile fetch for /p/[slug] at the Vercel Edge.
// TTL is 5 minutes (300 seconds), but can be busted instantly via revalidateTag('profile-${slugOrId}').
export const getCachedProfileBySlug = (slugOrId: string) => unstable_cache(
  async () => {
    const isId = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(slugOrId);
    
    const result = await db
      .select(PROFILE_PUBLIC_COLS)
      .from(profiles)
      .where(isId ? eq(profiles.id, slugOrId) : eq(profiles.slug, slugOrId))
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
          cardUid: cards.cardUid,
          status: cards.status,
        },
        profile: PROFILE_PUBLIC_COLS,
      })
      .from(cards)
      .leftJoin(profiles, eq(cards.profileId, profiles.id))
      .where(eq(cards.cardUid, sanitizedUid))
      .limit(1);

    return result[0] ?? null;
  },
  [`card-${sanitizedUid}`],
  { revalidate: 300, tags: [`card-${sanitizedUid}`] }
)();
