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
    <div className="min-h-screen bg-background flex pb-20 lg:pb-0 relative print:pb-0 print:bg-white">
      <div className="print:hidden contents">
        <DashboardSidebar />
        <BottomNav />
      </div>
      <div className="flex-1 flex flex-col min-h-screen lg:ml-64 w-full overflow-hidden print:ml-0 print:min-h-0">
        <div className="print:hidden contents">
          <DashboardHeader user={user} />
        </div>
        <main className="flex-1 flex flex-col p-6 lg:p-8 pb-32 lg:pb-8 max-w-7xl w-full mx-auto relative print:p-0 print:pb-0 print:m-0 print:max-w-none">
          <SwipeContainer>
            {children}
          </SwipeContainer>
        </main>
      </div>
      <div className="print:hidden contents">
        <FloatingShareWrapper />
      </div>
    </div>
  );
}
