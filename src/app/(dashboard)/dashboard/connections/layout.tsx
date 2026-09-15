import { ReactNode } from 'react';
import Link from 'next/link';
import { db } from '@/lib/db';
import { contactExchanges } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { createClient } from '@/lib/supabase/server';
import { ConnectionsTabs } from '@/components/dashboard/connections-tabs';

export default async function ConnectionsLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let pendingCount = 0;
  if (user) {
    const pendingRequests = await db
      .select({ id: contactExchanges.id })
      .from(contactExchanges)
      .where(
        and(
          eq(contactExchanges.recipientUserId, user.id),
          eq(contactExchanges.status, 'pending')
        )
      );
    pendingCount = pendingRequests.length;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">My Connections</h1>
        <p className="text-muted-foreground mt-2">
          Manage your network and contact exchange requests.
        </p>
      </div>

      <ConnectionsTabs pendingCount={pendingCount} />
      
      {children}
    </div>
  );
}
