import { db } from '@/lib/db';
import { cards, profiles } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { CardList } from '@/components/cards/card-list';
import { isMultiProfileEnabled } from '@/lib/feature-flags';

export const metadata = { title: 'My Cards' };

export default async function CardsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const multiProfileEnabled = isMultiProfileEnabled();

  const [userCards, userProfiles] = await Promise.all([
    db.select({
      id: cards.id,
      cardType: cards.cardType,
      cardUid: cards.cardUid,
      status: cards.status,
      profileId: cards.profileId,
      activatedAt: cards.activatedAt,
    })
    .from(cards)
    .where(eq(cards.userId, user.id))
    .orderBy(desc(cards.createdAt)),

    multiProfileEnabled ? db.select({
      id: profiles.id,
      label: profiles.label,
      firstName: profiles.firstName,
      lastName: profiles.lastName,
      jobTitle: profiles.jobTitle,
      isPublished: profiles.isPublished,
      isDefault: profiles.isDefault,
    })
    .from(profiles)
    .where(eq(profiles.userId, user.id))
    .orderBy(profiles.createdAt) : Promise.resolve([])
  ]);

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">My Cards</h1>
        <p className="text-muted-foreground mt-1">Manage your physical NFC hardware.</p>
      </div>

      <CardList
        initialCards={userCards}
        profiles={userProfiles}
        multiProfileEnabled={multiProfileEnabled}
      />
    </div>
  );
}
