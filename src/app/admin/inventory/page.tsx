import { redirect } from 'next/navigation';
import { verifyAdminSession } from '@/lib/admin/auth';
import { db } from '@/lib/db';
import { cards, users, profiles } from '@/lib/db/schema';
import { eq, desc, count, sql } from 'drizzle-orm';
import { AdminInventoryClient } from './admin-inventory-client';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Hardware Inventory & Provisioning | Tayz Admin',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function AdminInventoryPage() {
  const session = await verifyAdminSession();
  if (!session.authenticated) {
    redirect('/admin/login');
  }

  // 1. Fetch aggregate metrics
  const [totalResult, unclaimedResult, activeResult, metalResult, pvcResult, woodResult] =
    await Promise.all([
      db.select({ value: count() }).from(cards),
      db.select({ value: count() }).from(cards).where(eq(cards.status, 'unclaimed')),
      db.select({ value: count() }).from(cards).where(eq(cards.status, 'active')),
      db.select({ value: count() }).from(cards).where(sql`LOWER(${cards.cardType}) = 'metal'`),
      db.select({ value: count() }).from(cards).where(sql`LOWER(${cards.cardType}) = 'pvc'`),
      db.select({ value: count() }).from(cards).where(sql`LOWER(${cards.cardType}) = 'wood'`),
    ]);

  const stats = {
    total: totalResult[0]?.value ?? 0,
    unclaimed: unclaimedResult[0]?.value ?? 0,
    active: activeResult[0]?.value ?? 0,
    deactivated:
      (totalResult[0]?.value ?? 0) -
      (unclaimedResult[0]?.value ?? 0) -
      (activeResult[0]?.value ?? 0),
    metal: metalResult[0]?.value ?? 0,
    pvc: pvcResult[0]?.value ?? 0,
    wood: woodResult[0]?.value ?? 0,
  };

  // 2. Fetch recent 100 cards
  const recentCards = await db
    .select({
      id: cards.id,
      cardUid: cards.cardUid,
      cardType: cards.cardType,
      label: cards.label,
      status: cards.status,
      userId: cards.userId,
      userEmail: users.email,
      profileSlug: profiles.slug,
      createdAt: cards.createdAt,
      activatedAt: cards.activatedAt,
    })
    .from(cards)
    .leftJoin(users, eq(cards.userId, users.id))
    .leftJoin(profiles, eq(cards.profileId, profiles.id))
    .orderBy(desc(cards.createdAt))
    .limit(100);

  const formattedCards = recentCards.map((c) => ({
    id: c.id,
    cardUid: c.cardUid,
    cardType: c.cardType,
    label: c.label,
    status: c.status,
    userId: c.userId,
    userEmail: c.userEmail,
    profileSlug: c.profileSlug,
    createdAt: c.createdAt.toISOString(),
    activatedAt: c.activatedAt ? c.activatedAt.toISOString() : null,
  }));

  return (
    <AdminInventoryClient
      adminEmail={session.email || 'admin@tayz.app'}
      stats={stats}
      initialCards={formattedCards}
    />
  );
}
