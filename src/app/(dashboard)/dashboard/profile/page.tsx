import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

import { withRlsUser } from '@/lib/db/auth-wrapper';
import { profiles, cards } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { ProfileForm } from '@/components/profile/profile-form';
import { ProfileList } from '@/components/profile/profile-list';
import { isMultiProfileEnabled } from '@/lib/feature-flags';

export const metadata: Metadata = { title: 'My Profile' };

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const multiProfileEnabled = isMultiProfileEnabled();
  const { id: profileId } = await searchParams;

  return await withRlsUser(user, async (tx) => {
    // ── Multi-profile mode ───────────────────────────────────────────────────────
    if (multiProfileEnabled) {
      // If a specific profile ID is requested (via ?id=...), show its editor
      if (profileId) {
        const specificProfile = await tx.query.profiles.findFirst({
          where: eq(profiles.id, profileId),
        });

        // Security: ensure this profile belongs to the authenticated user
        if (!specificProfile || specificProfile.userId !== user.id) {
          redirect('/dashboard/profile');
        }

      return (
        <div className="space-y-6">
          <ProfileForm initialData={specificProfile} isMultiProfile={true} />
        </div>
      );
    }

      // No specific profile → show the profile list (profile overview)
      const [allProfiles, userCardsResult] = await Promise.all([
        tx
          .select({
            id: profiles.id,
            label: profiles.label,
            firstName: profiles.firstName,
            lastName: profiles.lastName,
            jobTitle: profiles.jobTitle,
            slug: profiles.slug,
            isPublished: profiles.isPublished,
            isDefault: profiles.isDefault,
            archivedAt: profiles.archivedAt,
            profilePhotoUrl: profiles.profilePhotoUrl,
          })
          .from(profiles)
          .where(eq(profiles.userId, user.id))
          .orderBy(profiles.createdAt),
        tx
          .select({ id: cards.id })
          .from(cards)
          .where(eq(cards.userId, user.id))
          .limit(1)
      ]);

      const hasCards = userCardsResult.length > 0;

    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Profiles</h1>
          <p className="text-muted-foreground mt-1">
            Each profile is a separate public persona. This is what people see when you tap your card. You can switch your active profile in My Cards.
          </p>
        </div>
        <ProfileList profiles={allProfiles} hasCards={hasCards} />
      </div>
    );
  }

    // ── Single-profile mode (default, production behavior unchanged) ─────────────
    const userProfileResult = await tx.select().from(profiles).where(eq(profiles.userId, user.id)).limit(1);
    const initialData = userProfileResult.length > 0 ? userProfileResult[0] : null;

    return (
      <div className="space-y-6">
        <ProfileForm initialData={initialData} isMultiProfile={false} />
      </div>
    );
  });
}
