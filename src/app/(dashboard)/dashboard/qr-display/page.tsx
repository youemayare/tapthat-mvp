import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { withRlsUser } from '@/lib/db/auth-wrapper';
import { eq } from 'drizzle-orm';
import { QrDisplayGenerator } from '@/components/dashboard/qr-display-generator';

export const metadata: Metadata = { title: 'Create QR Display | Tayz' };

export default async function QrDisplayPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { id: initialProfileId } = await searchParams;

  return await withRlsUser(user, async (tx) => {
    // Get the user's handle
    const dbUser = await tx.query.users.findFirst({
      where: eq((await import('@/lib/db/schema')).users.id, user.id)
    });
    const handle = dbUser?.handle || null;

    // Fetch all profiles owned by the user
    const profiles = await tx.query.profiles.findMany({
      where: eq((await import('@/lib/db/schema')).profiles.userId, user.id),
      orderBy: (profiles, { asc }) => [asc(profiles.createdAt)],
    });

    if (!profiles || profiles.length === 0) {
      redirect('/dashboard');
    }

    return (
      <div className="space-y-6 print:space-y-0 print:m-0 print:p-0">
        <QrDisplayGenerator 
          profiles={profiles} 
          handle={handle} 
          initialProfileId={initialProfileId} 
        />
      </div>
    );
  });
}
