import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { tapEvents, profiles, connections } from '@/lib/db/schema';
import { eq, and, gt, sql } from 'drizzle-orm';
import { createClient } from '@/lib/supabase/server';
import { AnalyticsCharts } from '@/components/analytics/analytics-charts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, MousePointerClick, Activity, Bookmark, UserCheck } from 'lucide-react';

export const metadata: Metadata = { title: 'Analytics' };

export default async function AnalyticsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Get user's profile
  const profileResult = await db.select().from(profiles).where(eq(profiles.userId, user.id)).limit(1);
  const profile = profileResult[0];

  if (!profile) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
        </div>
        <div className="bg-card text-card-foreground border border-border rounded-2xl p-8 text-center">
          <p className="text-muted-foreground">Please create your profile first to see analytics.</p>
        </div>
      </div>
    );
  }

  // Time range: last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  thirtyDaysAgo.setHours(0, 0, 0, 0);

  // 1. Top Level Metrics
  const totalTapsResult = await db.select({ count: sql<number>`count(*)` })
    .from(tapEvents)
    .where(eq(tapEvents.profileId, profile.id));
  const totalTaps = Number(totalTapsResult[0]?.count || 0);

  const uniqueTapsResult = await db.select({ count: sql<number>`count(*)` })
    .from(tapEvents)
    .where(and(eq(tapEvents.profileId, profile.id), eq(tapEvents.isUnique, true)));
  const uniqueTaps = Number(uniqueTapsResult[0]?.count || 0);

  const returningTaps = totalTaps - uniqueTaps;

  // Profile saves (how many people saved this profile as a connection)
  const savesResult = await db.select({ count: sql<number>`count(*)` })
    .from(connections)
    .where(eq(connections.profileId, profile.id));
  const totalSaves = Number(savesResult[0]?.count || 0);

  // Connections the user has saved themselves
  const connectionsSavedResult = await db.select({ count: sql<number>`count(*)` })
    .from(connections)
    .where(eq(connections.viewerUserId, user.id));
  const connectionsSaved = Number(connectionsSavedResult[0]?.count || 0);

  // 2. Daily Stats for Chart
  const dailyStatsRaw = await db.select({
    date: sql<string>`DATE(tapped_at)`,
    total: sql<number>`count(*)`,
    unique: sql<number>`count(case when is_unique = true then 1 end)`
  })
  .from(tapEvents)
  .where(and(eq(tapEvents.profileId, profile.id), gt(tapEvents.tappedAt, thirtyDaysAgo)))
  .groupBy(sql`DATE(tapped_at)`)
  .orderBy(sql`DATE(tapped_at)`);

  // Fill in missing days
  const dailyStatsMap = new Map(dailyStatsRaw.map(d => [d.date, d]));
  const dailyStats = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const stat = dailyStatsMap.get(dateStr);
    dailyStats.push({
      date: dateStr,
      total: stat ? Number(stat.total) : 0,
      unique: stat ? Number(stat.unique) : 0
    });
  }

  // 3. Device Stats
  const deviceStatsRaw = await db.select({
    deviceType: tapEvents.deviceType,
    count: sql<number>`count(*)`
  })
  .from(tapEvents)
  .where(eq(tapEvents.profileId, profile.id))
  .groupBy(tapEvents.deviceType);

  const deviceStats = deviceStatsRaw
    .filter(d => d.deviceType) // filter nulls
    .map(d => ({
      name: d.deviceType === 'mobile' ? 'Mobile' : d.deviceType === 'desktop' ? 'Desktop' : 'Tablet',
      value: Number(d.count)
    }));

  // 4. Browser Stats
  const browserStatsRaw = await db.select({
    browser: tapEvents.browser,
    count: sql<number>`count(*)`
  })
  .from(tapEvents)
  .where(eq(tapEvents.profileId, profile.id))
  .groupBy(tapEvents.browser);

  const browserStats = browserStatsRaw
    .filter(b => b.browser && b.browser !== 'Unknown') // filter nulls
    .map(b => ({
      name: b.browser || 'Unknown',
      value: Number(b.count)
    }));

  // 5. Location Stats (Countries)
  const locationStatsRaw = await db.select({
    country: tapEvents.country,
    count: sql<number>`count(*)`
  })
  .from(tapEvents)
  .where(eq(tapEvents.profileId, profile.id))
  .groupBy(tapEvents.country)
  .orderBy(sql`count(*) DESC`)
  .limit(10); // Top 10 locations

  const locationStats = locationStatsRaw
    .map(l => ({
      name: l.country || 'Unknown', // The UI will normalize ISO codes to names
      value: Number(l.count)
    }));

  return (
    <div className="space-y-8 pb-10">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Analytics</h1>
        <p className="text-muted-foreground mt-2">Track every tap — see who's visiting your profile, from where, and on what device.</p>
      </div>

      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Taps</CardTitle>
            <Activity className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{totalTaps}</div>
            <p className="text-xs text-muted-foreground mt-1">All time interactions</p>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Unique Visitors</CardTitle>
            <Users className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{uniqueTaps}</div>
            <p className="text-xs text-muted-foreground mt-1">Distinct devices</p>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Returning Visitors</CardTitle>
            <MousePointerClick className="h-4 w-4 text-pink-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{returningTaps}</div>
            <p className="text-xs text-muted-foreground mt-1">Multiple taps, same device</p>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Profile Saves</CardTitle>
            <Bookmark className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{totalSaves}</div>
            <p className="text-xs text-muted-foreground mt-1">Saved to TapThat accounts</p>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Connections Saved</CardTitle>
            <UserCheck className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{connectionsSaved}</div>
            <p className="text-xs text-muted-foreground mt-1">Profiles you&apos;ve saved</p>
          </CardContent>
        </Card>
      </div>

      {(totalTaps > 0) ? (
        <AnalyticsCharts 
          dailyStats={dailyStats} 
          deviceStats={deviceStats} 
          browserStats={browserStats} 
          locationStats={locationStats}
        />
      ) : (
        <div className="bg-card border border-border rounded-3xl p-12 text-center shadow-sm">
          <div className="w-16 h-16 bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Activity className="w-8 h-8 text-indigo-500" />
          </div>
          <h3 className="text-xl font-bold text-foreground mb-2">No data yet</h3>
          <p className="text-muted-foreground max-w-sm mx-auto">
            Once you activate your card and people start tapping it, your analytics will appear here.
          </p>
        </div>
      )}
    </div>
  );
}
