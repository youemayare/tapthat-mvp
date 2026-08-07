import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { createClient } from '@/lib/supabase/server';
import { ProfileForm } from '@/components/settings/profile-form';
import { PasswordForm } from '@/components/settings/password-form';
import { SessionManager } from '@/components/settings/session-manager';

export const metadata = { title: 'Settings' };

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch full name from public schema
  const dbUser = await db.query.users.findFirst({
    where: eq(users.id, user.id)
  });

  const fullName = dbUser?.fullName || user.user_metadata?.full_name || '';
  const email = user.email || '';
  
  // Check if they authenticated via OAuth (Google)
  const isOAuth = user.app_metadata?.provider === 'google' || user.app_metadata?.providers?.includes('google');

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your account, security, and sessions.</p>
      </div>

      <ProfileForm initialName={fullName} email={email} />

      {!isOAuth ? (
        <PasswordForm />
      ) : (
        <div className="bg-card border border-border rounded-xl p-6 mt-6">
          <h2 className="text-lg font-semibold text-foreground mb-2">Password & Security</h2>
          <p className="text-sm text-muted-foreground">
            Your account uses Google sign-in. Password management is handled by your identity provider.
          </p>
        </div>
      )}

      <SessionManager />
    </div>
  );
}
