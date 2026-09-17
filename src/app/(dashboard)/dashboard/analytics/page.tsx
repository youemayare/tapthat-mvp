import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { withRlsUser } from '@/lib/db/auth-wrapper';
import { tapEvents, profiles, connections, cards, contactSaves, contactExchanges } from '@/lib/db/schema';
import { eq, and, gt, sql, inArray, or, isNull } from 'drizzle-orm';
import { createClient } from '@/lib/supabase/server';
import { AnalyticsCharts } from '@/components/analytics/analytics-charts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, MousePointerClick, Activity, Bookmark, UserCheck, Download } from 'lucide-react';

import { ProfileFilter } from '@/components/analytics/profile-filter';
import { TimeFilter } from '@/components/analytics/time-filter';

export const metadata: Metadata = { title: 'Analytics' };

export default async function AnalyticsPage(
  props: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }
) {
  const searchParams = await props.searchParams;
  const selectedProfileId = typeof searchParams.profile === 'string' ? searchParams.profile : null;
  const rangeParam = typeof searchParams.range === 'string' ? searchParams.range : '30d';

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Determine date bounds
  let days = 30;
  if (rangeParam === '7d') days = 7;
  if (rangeParam === 'all') days = 0;

  const startDate = days > 0 ? new Date() : null;
  if (startDate) {
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);
  }

  // 1. Fetch profiles and setup conditions
  const { userProfiles, profileIds, profileTapsCondition } = await withRlsUser(user, async (tx) => {
    const userProfiles = await tx.select().from(profiles).where(eq(profiles.userId, user.id));
    if (userProfiles.length === 0) {
      return { userProfiles: [], profileIds: [], profileTapsCondition: undefined };
    }
    
    const selectedProfiles = selectedProfileId 
      ? userProfiles.filter(p => p.id === selectedProfileId) 
      : userProfiles;
      
    const validProfiles = selectedProfiles.length > 0 ? selectedProfiles : userProfiles;
    const profileIds = validProfiles.map(p => p.id);

    const cardsCondition = selectedProfileId
      ? inArray(cards.profileId, profileIds)
      : eq(cards.userId, user.id);
      
    const userCards = await tx.select({ id: cards.id }).from(cards).where(cardsCondition);
    
    const cardIds = userCards.map(c => c.id);
    const profileTapsCondition = cardIds.length > 0
      ? or(
          inArray(tapEvents.profileId, profileIds),
          and(
            inArray(tapEvents.cardId, cardIds),
            isNull(tapEvents.profileId)
          )
        )
      : inArray(tapEvents.profileId, profileIds);

    return { userProfiles, profileIds, profileTapsCondition };
  });

  if (!userProfiles || userProfiles.length === 0) {
    return (
      <div className="space-y-6">
        <div><h1 className="text-2xl font-bold text-foreground">Analytics</h1></div>
        <div className="bg-card text-card-foreground border border-border rounded-2xl p-8 text-center">
          <p className="text-muted-foreground">Please create your profile first to see analytics.</p>
        </div>
      </div>
    );
  }

  // Base date conditions
  const tapDateCond = startDate ? gt(tapEvents.tappedAt, startDate) : undefined;
  const connDateCond = startDate ? gt(connections.createdAt, startDate) : undefined;
  const saveDateCond = startDate ? gt(contactSaves.savedAt, startDate) : undefined;
  const exchangeDateCond = startDate ? gt(contactExchanges.createdAt, startDate) : undefined;

  // 2. Execute heavy aggregations concurrently
  const [
    savesResult,
    connectionsSavedResult,
    totalTapsResult,
    uniqueTapsResult,
    dailyStatsRaw,
    deviceStatsRaw,
    browserStatsRaw,
    locationStatsRaw,
    contactSavesResult,
    dailyExchangesRaw,
    channelStatsRaw
  ] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(connections).where(and(inArray(connections.profileId, profileIds), connDateCond)),
    withRlsUser(user, async (tx) => tx.select({ count: sql<number>`count(*)` }).from(connections).where(and(eq(connections.viewerUserId, user.id), connDateCond))),
    withRlsUser(user, async (tx) => tx.select({ count: sql<number>`count(*)` }).from(tapEvents).where(and(profileTapsCondition!, tapDateCond))),
    withRlsUser(user, async (tx) => tx.select({ count: sql<number>`count(*)` }).from(tapEvents).where(and(profileTapsCondition!, tapDateCond, eq(tapEvents.isUnique, true)))),
    withRlsUser(user, async (tx) => tx.select({ date: sql<string>`DATE(tapped_at)`, total: sql<number>`count(*)`, unique: sql<number>`count(case when is_unique = true then 1 end)` })
      .from(tapEvents).where(and(profileTapsCondition!, tapDateCond)).groupBy(sql`DATE(tapped_at)`).orderBy(sql`DATE(tapped_at)`)),
    withRlsUser(user, async (tx) => tx.select({ deviceType: tapEvents.deviceType, count: sql<number>`count(*)` }).from(tapEvents).where(and(profileTapsCondition!, tapDateCond)).groupBy(tapEvents.deviceType)),
    withRlsUser(user, async (tx) => tx.select({ browser: tapEvents.browser, count: sql<number>`count(*)` }).from(tapEvents).where(and(profileTapsCondition!, tapDateCond)).groupBy(tapEvents.browser)),
    withRlsUser(user, async (tx) => tx.select({ country: tapEvents.country, count: sql<number>`count(*)` }).from(tapEvents).where(and(profileTapsCondition!, tapDateCond)).groupBy(tapEvents.country).orderBy(sql`count(*) DESC`).limit(10)),
    withRlsUser(user, async (tx) => tx.select({ count: sql<number>`count(*)` }).from(contactSaves).where(and(inArray(contactSaves.profileId, profileIds), saveDateCond))),
    withRlsUser(user, async (tx) => tx.select({ date: sql<string>`DATE(created_at)`, count: sql<number>`count(*)` })
      .from(contactExchanges).where(and(inArray(contactExchanges.recipientProfileId, profileIds), exchangeDateCond)).groupBy(sql`DATE(created_at)`).orderBy(sql`DATE(created_at)`)),
    withRlsUser(user, async (tx) => tx.select({ channel: contactExchanges.sourceChannel, count: sql<number>`count(*)` })
      .from(contactExchanges).where(and(inArray(contactExchanges.recipientProfileId, profileIds), exchangeDateCond)).groupBy(contactExchanges.sourceChannel))
  ]);

  const totalTaps = Number(totalTapsResult[0]?.count || 0);
  const uniqueTaps = Number(uniqueTapsResult[0]?.count || 0);
  const returningTaps = totalTaps - uniqueTaps;
  const totalSaves = Number(savesResult[0]?.count || 0);
  const connectionsSaved = Number(connectionsSavedResult[0]?.count || 0);
  const totalContactSaves = Number(contactSavesResult[0]?.count || 0);

  const dailyStatsMap = new Map(dailyStatsRaw.map(d => [d.date, d]));
  const dailyExchangesMap = new Map(dailyExchangesRaw.map(d => [d.date, d]));
  const dailyStats = [];

  if (days > 0) {
    // Fill every day in the range
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const stat = dailyStatsMap.get(dateStr);
      const exStat = dailyExchangesMap.get(dateStr);
      dailyStats.push({
        date: dateStr,
        total: stat ? Number(stat.total) : 0,
        unique: stat ? Number(stat.unique) : 0,
        contacts: exStat ? Number(exStat.count) : 0
      });
    }
  } else {
    // All time: show only dates with data, sorted
    const allDates = Array.from(new Set([...dailyStatsMap.keys(), ...dailyExchangesMap.keys()])).sort();
    for (const dateStr of allDates) {
      const stat = dailyStatsMap.get(dateStr);
      const exStat = dailyExchangesMap.get(dateStr);
      dailyStats.push({
        date: dateStr,
        total: stat ? Number(stat.total) : 0,
        unique: stat ? Number(stat.unique) : 0,
        contacts: exStat ? Number(exStat.count) : 0
      });
    }
  }

  const channelStatsMap: Record<string, string> = {
    'nfc': 'NFC Tap',
    'qr': 'QR Code',
    'link': 'Profile Link',
    'unknown': 'Direct / Unknown'
  };

  const channelStats = channelStatsRaw.map(c => ({
    name: channelStatsMap[c.channel] || c.channel,
    value: Number(c.count)
  })).sort((a, b) => b.value - a.value);

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Analytics</h1>
          <p className="text-muted-foreground mt-2">Track your profile reach and audience engagement</p>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <TimeFilter />
          <ProfileFilter 
            profiles={userProfiles.map((p: any) => ({ 
              id: p.id, label: p.label, firstName: p.firstName, lastName: p.lastName 
            }))} 
            selectedProfileId={selectedProfileId} 
          />
        </div>
      </div>

      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-start justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Profile Views</CardTitle>
            <Activity className="h-4 w-4 text-brand-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{totalTaps}</div>
            <p className="text-xs text-muted-foreground mt-1">Every time your profile was opened</p>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-start justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Estimated Unique Visitors</CardTitle>
            <Users className="h-4 w-4 text-violet-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{uniqueTaps}</div>
            <p className="text-xs text-muted-foreground mt-1">Estimated number of different people who visited your profile</p>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-start justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Estimated Repeat Visitors</CardTitle>
            <MousePointerClick className="h-4 w-4 text-pink-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{returningTaps}</div>
            <p className="text-xs text-muted-foreground mt-1">Estimated repeat visits from people who have viewed your profile before</p>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-start justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Profile Saves</CardTitle>
            <Bookmark className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{totalSaves}</div>
            <p className="text-xs text-muted-foreground mt-1">Times your profile was saved to another Anoya user’s Connections</p>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-start justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Contact Saves</CardTitle>
            <Download className="h-4 w-4 text-sky-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{totalContactSaves}</div>
            <p className="text-xs text-muted-foreground mt-1">Times visitors clicked Save Contact</p>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-start justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Connections Saved</CardTitle>
            <UserCheck className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{connectionsSaved}</div>
            <p className="text-xs text-muted-foreground mt-1">Profiles you&apos;ve saved to your Anoya connections</p>
          </CardContent>
        </Card>
      </div>

      {(totalTaps > 0) ? (
        <AnalyticsCharts 
          dailyStats={dailyStats} 
          channelStats={channelStats}
        />
      ) : (
        <div className="bg-card border border-border rounded-3xl p-12 text-center shadow-sm">
          <div className="w-16 h-16 bg-brand-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Activity className="w-8 h-8 text-brand-500" />
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
