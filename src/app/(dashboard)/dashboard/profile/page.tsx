import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { profiles } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { ProfileForm } from '@/components/profile/profile-form';

export const metadata: Metadata = { title: 'My Profile' };

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch existing profile if any
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
