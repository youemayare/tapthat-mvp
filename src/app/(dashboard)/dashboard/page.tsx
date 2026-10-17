import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';

import { withRlsUser } from '@/lib/db/auth-wrapper';
import { cards, tapEvents, profiles } from '@/lib/db/schema';
import { eq, count, or, inArray } from 'drizzle-orm';
import { BarChart3, CreditCard, Eye, Users, QrCode } from 'lucide-react';
import { getGoogleWalletSaveUrl } from '@/lib/wallet/google';
import {
  GoogleWalletAction,
  type WalletProfileOption,
} from '@/components/dashboard/google-wallet-action';

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
    walletProfiles: [] as WalletProfileOption[],
    defaultSelectedProfileId: null as string | null,
    activeCardUid: null as string | null,
  };

  try {
    const result = await withRlsUser(user, async (tx) => {
      // Fetch profiles and cards in parallel — eliminates sequential DB waterfall (P-4)
      const [userProfiles, cardRows] = await Promise.all([
        tx.select().from(profiles).where(eq(profiles.userId, user!.id)),
        tx.select().from(cards).where(eq(cards.userId, user!.id)),
      ]);

      const nonArchivedProfiles = userProfiles.filter((p) => !p.archivedAt);
      const activeCards = cardRows.filter((c) => c.status === 'active');
      const activeCard = activeCards[0] ?? null;
      const activeCardProfileIds = new Set(
        activeCards.map((c) => c.profileId).filter(Boolean) as string[]
      );

      const primaryProfile = activeCard
        ? nonArchivedProfiles.find((p) => p.id === activeCard.profileId) ||
          nonArchivedProfiles.find((p) => p.isDefault) ||
          nonArchivedProfiles[0] ||
          null
        : nonArchivedProfiles.find((p) => p.isDefault) ||
          nonArchivedProfiles[0] ||
          null;

      const userProfilesCount = nonArchivedProfiles.length;
      const totalCards = cardRows.length;

      let totalTaps = 0;
      const activeCardUid = activeCard ? activeCard.cardUid : null;

      if (userProfiles.length > 0) {
        const profileIds = userProfiles.map((p) => p.id);
        const cardIds = cardRows.map((c) => c.id);

        const profileTapsCondition =
          cardIds.length > 0
            ? or(inArray(tapEvents.profileId, profileIds), inArray(tapEvents.cardId, cardIds))
            : inArray(tapEvents.profileId, profileIds);

        const tapRows = await tx
          .select({ count: count() })
          .from(tapEvents)
          .where(profileTapsCondition);
        totalTaps = tapRows[0]?.count ?? 0;
      }

      const walletProfiles: WalletProfileOption[] = nonArchivedProfiles.map((p) => {
        const fullName = [p.firstName, p.lastName].filter(Boolean).join(' ') || 'My Profile';
        return {
          id: p.id,
          label: p.label,
          firstName: p.firstName,
          lastName: p.lastName,
          jobTitle: p.jobTitle,
          companyName: p.companyName,
          profilePhotoUrl: p.profilePhotoUrl,
          isPublished: p.isPublished,
          isDefault: p.isDefault,
          isActiveOnCard: activeCardProfileIds.has(p.id),
          walletUrl: getGoogleWalletSaveUrl({
            id: p.id,
            name: fullName,
            jobTitle: p.jobTitle,
            company: p.companyName,
            slug: p.slug,
            profilePhotoUrl: p.profilePhotoUrl,
            companyLogoUrl: p.companyLogoUrl,
            walletThemeColor: p.walletThemeColor,
            walletHeroImageUrl: p.walletHeroImageUrl,
            phone: p.phone,
            email: p.email,
            websiteUrl: p.websiteUrl,
            linkedinUrl: p.linkedinUrl,
            whatsapp: p.whatsapp,
            updatedAt: p.updatedAt,
          }),
        };
      });

      return {
        totalTaps,
        totalCards,
        userProfilesCount,
        walletProfiles,
        defaultSelectedProfileId: primaryProfile?.id ?? null,
        activeCardUid,
      };
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
        <p className="text-muted-foreground mt-1">Here&apos;s an overview of your Tayz profile.</p>
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
            <p className="text-muted-foreground text-sm">Link your NFC card to your profile.</p>
          </a>

          <a
            href="/dashboard/analytics"
            className="group bg-card text-card-foreground border border-border rounded-2xl p-5 hover:bg-primary/8 hover:border-brand-500/30 transition-all"
          >
            <BarChart3 className="w-6 h-6 text-brand-400 mb-3 group-hover:scale-110 transition-transform" />
            <h3 className="text-foreground font-semibold mb-1">View Analytics</h3>
            <p className="text-muted-foreground text-sm">See who tapped your card and from where.</p>
          </a>

          <a
            href="/dashboard/qr-display"
            className="group bg-card text-card-foreground border border-border rounded-2xl p-5 hover:bg-primary/8 hover:border-brand-500/30 transition-all"
          >
            <QrCode className="w-6 h-6 text-brand-400 mb-3 group-hover:scale-110 transition-transform" />
            <h3 className="text-foreground font-semibold mb-1">Create QR Display</h3>
            <p className="text-muted-foreground text-sm">Download or print a QR poster for your spaces.</p>
          </a>

          {statsData.walletProfiles.length > 0 && (
            <GoogleWalletAction
              profiles={statsData.walletProfiles}
              defaultSelectedId={statsData.defaultSelectedProfileId}
            />
          )}
        </div>
      </div>
    </div>
  );
}
