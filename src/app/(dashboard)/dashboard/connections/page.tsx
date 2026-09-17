import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { connections, connectionNotes, profiles } from '@/lib/db/schema';
import { eq, desc, and } from 'drizzle-orm';
import { createClient } from '@/lib/supabase/server';
import { UserCheck } from 'lucide-react';
import { ConnectionCard } from '@/components/dashboard/connection-card';
import { AcceptedExchangeCard } from '@/components/dashboard/accepted-exchange-card';
import { ConnectionsListClient } from '@/components/dashboard/connections-list-client';
import { contactExchanges } from '@/lib/db/schema';

export const metadata: Metadata = { title: 'My Connections' };

export default async function ConnectionsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const rows = await db
    .select({
      connection: connections,
      profile: profiles,
      note: connectionNotes,
    })
    .from(connections)
    .innerJoin(profiles, eq(connections.profileId, profiles.id))
    .leftJoin(connectionNotes, eq(connections.id, connectionNotes.connectionId))
    .where(eq(connections.viewerUserId, user.id))
    .orderBy(desc(connections.createdAt));

  const manualExchanges = await db
    .select()
    .from(contactExchanges)
    .where(
      and(
        eq(contactExchanges.recipientUserId, user.id),
        eq(contactExchanges.sourceType, 'manual'),
        eq(contactExchanges.status, 'accepted')
      )
    )
    .orderBy(desc(contactExchanges.createdAt));

  // Merge and sort
  const combined = [
    ...rows.map(r => ({ type: 'connection' as const, data: r, date: r.connection.createdAt })),
    ...manualExchanges.map(e => ({ type: 'manual' as const, data: e, date: e.createdAt }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="space-y-4">
      <ConnectionsListClient initialItems={combined} />
    </div>
  );
}


