import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { connections, connectionNotes, profiles } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { createClient } from '@/lib/supabase/server';
import { UserCheck } from 'lucide-react';
import { ConnectionCard } from '@/components/dashboard/connection-card';

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

  return (
    <div className="space-y-8 pb-10">
      <div>
        <h1 className="text-3xl font-bold text-foreground">My Connections</h1>
        <p className="text-muted-foreground mt-2">
          People you've saved while exploring Anoya profiles.
        </p>
      </div>

      {rows.length === 0 ? (
        <div className="bg-card border border-border rounded-3xl p-12 text-center shadow-sm">
          <div className="w-16 h-16 bg-brand-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <UserCheck className="w-8 h-8 text-brand-500" />
          </div>
          <h3 className="text-xl font-bold text-foreground mb-2">No connections yet</h3>
          <p className="text-muted-foreground max-w-sm mx-auto">
            When you tap someone's Anoya card and hit "Save to My Connections", they'll appear here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {rows.map(({ connection, profile, note }) => (
            <ConnectionCard 
              key={connection.id} 
              connection={connection} 
              profile={profile} 
              note={note} 
            />
          ))}
        </div>
      )}
    </div>
  );
}
