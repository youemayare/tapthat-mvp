import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';

import { withRlsUser } from '@/lib/db/auth-wrapper';
import { cards, tapEvents, profiles } from '@/lib/db/schema';
import { eq, count, or, inArray } from 'drizzle-orm';
import { BarChart3, CreditCard, Eye, Users, Wallet } from 'lucide-react';
import { getGoogleWalletSaveUrl } from '@/lib/wallet/google';
import { QrShareCard } from '@/components/dashboard/qr-share-card';

export const metadata: Metadata = { title: 'Dashboard' };

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const name = user?.user_metadata?.full_name?.split(' ')[0] ?? 'there';

  // Quick stats
  let statsData = {
    totalTaps: 0,
    totalCards: 0,
    userProfilesCount: 0,
    googleWalletUrl: null as string | null,
    activeCardUid: null as string | null,
  };

  try {
    const result = await withRlsUser(user, async (tx) => {
      // Fetch profiles and cards in parallel — eliminates sequential DB waterfall (P-4)
      const [userProfiles, cardRows] = await Promise.all([
        tx.select().from(profiles).where(eq(profiles.userId, user!.id)),
        tx.select().from(cards).where(eq(cards.userId, user!.id)),
      ]);

      const activeCard = cardRows.find(c => c.status === 'active');

      const profile = activeCard 
        ? userProfiles.find(p => p.id === activeCard.profileId) || userProfiles[0] || null
        : userProfiles[0] || null;

      const userProfilesCount = userProfiles.length;
      const totalCards = cardRows.length;
      
      let totalTaps = 0;
      let googleWalletUrl = null;
      let activeCardUid = null;

      if (activeCard) {
        activeCardUid = activeCard.cardUid;
      }

      if (profile) {
        const profileIds = userProfiles.map(p => p.id);
        const cardIds = cardRows.map(c => c.id);
        
        const profileTapsCondition = cardIds.length > 0
          ? or(inArray(tapEvents.profileId, profileIds), inArray(tapEvents.cardId, cardIds))
          : inArray(tapEvents.profileId, profileIds);

        const tapRows = await tx.select({ count: count() }).from(tapEvents).where(profileTapsCondition);
        totalTaps = tapRows[0]?.count ?? 0;

        // Only generate Google Wallet URL if they have a profile and an active card
        if (activeCard) {
          const fullName = [profile.firstName, profile.lastName].filter(Boolean).join(' ') || 'My Profile';
          googleWalletUrl = getGoogleWalletSaveUrl({
            id: profile.id,
            name: fullName,
            jobTitle: profile.jobTitle,
            company: profile.companyName,
            slug: profile.slug,
            cardUid: activeCard.cardUid,
            profilePhotoUrl: profile.profilePhotoUrl,
            companyLogoUrl: profile.companyLogoUrl,
          });
        }
      }

      return { totalTaps, totalCards, userProfilesCount, googleWalletUrl, activeCardUid };
    });

    if (result) {
      statsData = result;
    }
  } catch {
    // DB not yet connected during initial setup
  }

  const stats = [
    { label: 'Total Taps', value: statsData.totalTaps, icon: Eye, color: 'brand' },
    { label: 'Cards Registered', value: statsData.totalCards, icon: CreditCard, color: 'violet' },
    { label: 'Active Profiles', value: statsData.userProfilesCount, icon: Users, color: 'emerald' },
  ];

  return (
    <div className="space-y-8">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Good to see you, {name}</h1>
        <p className="text-muted-foreground mt-1">Here&apos;s an overview of your Anoya profile.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map(({ label, value, icon: Icon }) => (
          <div
            key={label}
            className="bg-card text-card-foreground border border-border rounded-2xl p-5 flex items-center gap-4"
          >
            <div className="w-11 h-11 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center flex-shrink-0">
              <Icon className="w-5 h-5 text-brand-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{value}</p>
              <p className="text-muted-foreground text-sm">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <a
            href="/dashboard/profile"
            className="group bg-card text-card-foreground border border-border rounded-2xl p-5 hover:bg-primary/8 hover:border-brand-500/30 transition-all"
          >
            <Users className="w-6 h-6 text-brand-400 mb-3 group-hover:scale-110 transition-transform" />
            <h3 className="text-foreground font-semibold mb-1">Set Up Profile</h3>
            <p className="text-muted-foreground text-sm">Add your photo, contact info, and social links.</p>
          </a>
          
          <a
            href="/dashboard/cards"
            className="group bg-card text-card-foreground border border-border rounded-2xl p-5 hover:bg-primary/8 hover:border-brand-500/30 transition-all"
          >
            <CreditCard className="w-6 h-6 text-brand-400 mb-3 group-hover:scale-110 transition-transform" />
            <h3 className="text-foreground font-semibold mb-1">Register Card</h3>
            <p className="text-muted-foreground text-sm">Link your NFC card UID to your profile.</p>
          </a>

          <a
            href="/dashboard/analytics"
            className="group bg-card text-card-foreground border border-border rounded-2xl p-5 hover:bg-primary/8 hover:border-brand-500/30 transition-all"
          >
            <BarChart3 className="w-6 h-6 text-brand-400 mb-3 group-hover:scale-110 transition-transform" />
            <h3 className="text-foreground font-semibold mb-1">View Analytics</h3>
            <p className="text-muted-foreground text-sm">See who tapped your card and from where.</p>
          </a>

          {/* QR Share Modal Component */}
          {statsData.activeCardUid && (
            <QrShareCard cardUid={statsData.activeCardUid} />
          )}

          {statsData.googleWalletUrl && (
            <a
              href={statsData.googleWalletUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group bg-card text-card-foreground border border-border rounded-2xl p-5 hover:bg-primary/8 hover:border-brand-500/30 transition-all"
            >
              <Wallet className="w-6 h-6 text-brand-400 mb-3 group-hover:scale-110 transition-transform" />
              <h3 className="text-foreground font-semibold mb-1">Save to Google Wallet</h3>
              <p className="text-muted-foreground text-sm">Add your digital business card to your mobile wallet.</p>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
