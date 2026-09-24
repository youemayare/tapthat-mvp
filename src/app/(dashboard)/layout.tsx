import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { DashboardSidebar } from '@/components/dashboard/sidebar';
import { DashboardHeader } from '@/components/dashboard/header';
import { BottomNav } from '@/components/dashboard/bottom-nav';
import { SwipeContainer } from '@/components/dashboard/swipe-container';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { default: 'Dashboard | Tayz', template: '%s | Tayz' },
  robots: { index: false },
};

import { FloatingShareWrapper } from '@/components/dashboard/floating-share-wrapper';

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
    <div className="min-h-screen bg-background flex pb-20 lg:pb-0 relative">
      <DashboardSidebar />
      <BottomNav />
      <div className="flex-1 flex flex-col min-h-screen lg:ml-64 w-full overflow-hidden">
        <DashboardHeader user={user} />
        <main className="flex-1 flex flex-col p-6 lg:p-8 pb-32 lg:pb-8 max-w-7xl w-full mx-auto relative">
          <SwipeContainer>
            {children}
          </SwipeContainer>
        </main>
      </div>
      <FloatingShareWrapper />
    </div>
  );
}
