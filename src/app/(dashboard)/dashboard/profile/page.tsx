import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { profiles } from '@/lib/db/schema';
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

  // ── Multi-profile mode ───────────────────────────────────────────────────────
  if (multiProfileEnabled) {
    // If a specific profile ID is requested (via ?id=...), show its editor
    if (profileId) {
      const specificProfile = await db.query.profiles.findFirst({
        where: eq(profiles.id, profileId),
      });

      // Security: ensure this profile belongs to the authenticated user
      if (!specificProfile || specificProfile.userId !== user.id) {
        redirect('/dashboard/profile');
      }

      return (
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <a
              href="/dashboard/profile"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              ← All profiles
            </a>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {specificProfile.label ?? 'Edit Profile'}
            </h1>
            <p className="text-muted-foreground mt-1">
              This is what people see when they tap a card assigned to this profile.
            </p>
          </div>
          <ProfileForm initialData={specificProfile} />
        </div>
      );
    }

    // No specific profile → show the profile list (profile overview)
    const allProfiles = await db
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
      })
      .from(profiles)
      .where(eq(profiles.userId, user.id))
      .orderBy(profiles.createdAt);

    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Profiles</h1>
          <p className="text-muted-foreground mt-1">
            Each profile is a separate public persona. Assign a profile to a card to control what people see when you tap your card.
          </p>
        </div>
        <ProfileList profiles={allProfiles} />
      </div>
    );
  }

  // ── Single-profile mode (default, production behavior unchanged) ─────────────
  const userProfileResult = await db.select().from(profiles).where(eq(profiles.userId, user.id)).limit(1);
  const initialData = userProfileResult.length > 0 ? userProfileResult[0] : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">My Profile</h1>
        <p className="text-muted-foreground mt-1">Manage your professional profile — this is what people see when they tap your card.</p>
      </div>
      <ProfileForm initialData={initialData} />
    </div>
  );
}
