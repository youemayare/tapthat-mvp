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

function toSafeIsoString(dateVal: unknown): string {
  if (!dateVal) return new Date().toISOString();
  if (dateVal instanceof Date) return dateVal.toISOString();
  try {
    const d = new Date(dateVal as string);
    return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
  } catch {
    return new Date().toISOString();
  }
}

function toSafeOptionalIsoString(dateVal: unknown): string | null {
  if (!dateVal) return null;
  if (dateVal instanceof Date) return dateVal.toISOString();
  try {
    const d = new Date(dateVal as string);
    return isNaN(d.getTime()) ? null : d.toISOString();
  } catch {
    return null;
  }
}

export default async function AdminInventoryPage() {
  const session = await verifyAdminSession();
  if (!session.authenticated) {
    redirect('/admin/login');
  }

  let stats = {
    total: 0,
    unclaimed: 0,
    active: 0,
    deactivated: 0,
    metal: 0,
    pvc: 0,
    wood: 0,
  };

  let formattedCards: Array<{
    id: string;
    cardUid: string;
    cardType: string | null;
    label: string | null;
    status: string;
    userId: string | null;
    userEmail: string | null;
    profileSlug: string | null;
    createdAt: string;
    activatedAt: string | null;
  }> = [];

  try {
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

    stats = {
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

    formattedCards = recentCards.map((c) => ({
      id: c.id,
      cardUid: c.cardUid,
      cardType: c.cardType,
      label: c.label,
      status: c.status,
      userId: c.userId,
      userEmail: c.userEmail,
      profileSlug: c.profileSlug,
      createdAt: toSafeIsoString(c.createdAt),
      activatedAt: toSafeOptionalIsoString(c.activatedAt),
    }));
  } catch (error) {
    console.error('Error fetching inventory data in AdminInventoryPage:', error);
  }

  return (
    <AdminInventoryClient
      adminEmail={session.email || 'admin@tayz.app'}
      stats={stats}
      initialCards={formattedCards}
    />
  );
}
