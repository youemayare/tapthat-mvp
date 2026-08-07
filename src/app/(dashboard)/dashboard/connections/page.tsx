import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { db } from '@/lib/db';
import { connections, profiles, cards } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { createClient } from '@/lib/supabase/server';
import { UserCheck, ExternalLink } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export const metadata: Metadata = { title: 'My Connections' };

export default async function ConnectionsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  // Fetch all connections with their linked profiles and card UIDs
  const rows = await db
    .select({
      connection: connections,
      profile: profiles,
    })
    .from(connections)
    .innerJoin(profiles, eq(connections.profileId, profiles.id))
    .where(eq(connections.viewerUserId, user.id))
    .orderBy(connections.createdAt);

  // No longer need cardUid for viewing connections, we use the persistent /p/[slug-or-id] URL

  return (
    <div className="space-y-8 pb-10">
      <div>
        <h1 className="text-3xl font-bold text-foreground">My Connections</h1>
        <p className="text-muted-foreground mt-2">
          People you&apos;ve saved while exploring TapThat profiles.
        </p>
      </div>

      {rows.length === 0 ? (
        <div className="bg-card border border-border rounded-3xl p-12 text-center shadow-sm">
          <div className="w-16 h-16 bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <UserCheck className="w-8 h-8 text-indigo-500" />
          </div>
          <h3 className="text-xl font-bold text-foreground mb-2">No connections yet</h3>
          <p className="text-muted-foreground max-w-sm mx-auto">
            When you tap someone&apos;s TapThat card and hit &quot;Save to My Connections&quot;, they&apos;ll appear here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {rows.map(({ connection, profile }) => {
            const fullName = [profile.firstName, profile.lastName].filter(Boolean).join(' ') || 'Unknown';
            const href = `/p/${profile.slug || profile.id}`;

            return (
              <Link
                key={connection.id}
                href={href}
                className="group bg-card border border-border rounded-2xl p-5 hover:border-indigo-500/30 hover:bg-accent/30 transition-all flex flex-col gap-3"
              >
                {/* Avatar + name row */}
                <div className="flex items-center gap-4">
                  {profile.profilePhotoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={profile.profilePhotoUrl}
                      alt={fullName}
                      className="w-12 h-12 rounded-full object-cover ring-2 ring-indigo-500/20 flex-shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center flex-shrink-0">
                      <span className="text-lg font-bold text-indigo-300">
                        {profile.firstName?.[0] ?? '?'}
                      </span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground truncate">{fullName}</p>
                    {profile.jobTitle && (
                      <p className="text-sm text-indigo-300 truncate">{profile.jobTitle}</p>
                    )}
                  </div>
                  <ExternalLink className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                </div>

                {/* Company */}
                {profile.companyName && (
                  <p className="text-sm text-muted-foreground truncate">{profile.companyName}</p>
                )}

                {/* Date */}
                <p className="text-xs text-muted-foreground/60 mt-auto pt-2 border-t border-border/50">
                  Connected {formatDistanceToNow(new Date(connection.createdAt), { addSuffix: true })}
                </p>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
