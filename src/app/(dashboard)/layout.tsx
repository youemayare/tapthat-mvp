import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { DashboardSidebar } from '@/components/dashboard/sidebar';
import { DashboardHeader } from '@/components/dashboard/header';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { default: 'Dashboard | Anoya', template: '%s | Anoya' },
  robots: { index: false },
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-background flex">
      <DashboardSidebar />
      <div className="flex-1 flex flex-col min-h-screen lg:ml-64">
        <DashboardHeader user={user} />
        <main className="flex-1 p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
