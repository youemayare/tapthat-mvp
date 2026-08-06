'use server';

import { revalidatePath } from 'next/cache';
import { eq, and, isNull } from 'drizzle-orm';
import { db } from '@/lib/db';
import { users, profiles, cards } from '@/lib/db/schema';
import { createClient } from '@/lib/supabase/server';

export type ClaimResult =
  | { success: true }
  | { success: false; message: string; errorType: 'invalid' | 'already_claimed_by_you' | 'already_claimed' | 'server_error' };

export async function claimCardAction(uid: string): Promise<ClaimResult> {
  const sanitizedUid = uid.toUpperCase();
  if (!/^[A-Z0-9]{8,64}$/.test(sanitizedUid)) {
    return { success: false, message: 'Invalid card ID format.', errorType: 'invalid' };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, message: 'You must be logged in to claim a card.', errorType: 'server_error' };
  }

  try {
    const result = await db.transaction(async (tx) => {
      // 1. Self-healing: ensure user exists in public.users
      await tx
        .insert(users)
        .values({
          id: user.id,
          email: user.email!,
          fullName: user.user_metadata?.full_name ?? null,
          avatarUrl: user.user_metadata?.avatar_url ?? null,
        })
        .onConflictDoNothing();

      // 2. Fetch or create profile
      let profile = await tx.query.profiles.findFirst({
        where: eq(profiles.userId, user.id),
      });

      if (!profile) {
        const [newProfile] = await tx
          .insert(profiles)
          .values({
            userId: user.id,
            isPublished: false,
          })
          .returning();
        profile = newProfile;
      }

      // 3. Atomically claim the card
      if (process.env.NODE_ENV === 'development') {
        // DEV ONLY: Auto-provision the card so you can test any UID locally
        await tx.insert(cards).values({ cardUid: sanitizedUid, status: 'unclaimed' }).onConflictDoNothing();
      }

      const [updatedCard] = await tx
        .update(cards)
        .set({
          userId: user.id,
          profileId: profile.id,
          status: 'active',
          activatedAt: new Date(),
        })
        .where(
          and(
            eq(cards.cardUid, sanitizedUid),
            eq(cards.status, 'unclaimed'),
            isNull(cards.userId)
          )
        )
        .returning();

      if (!updatedCard) {
        // The update matched 0 rows. Let's figure out why for the UI.
        const existingCard = await tx.query.cards.findFirst({
          where: eq(cards.cardUid, sanitizedUid),
        });

        if (!existingCard) {
          return { success: false, message: 'This card does not exist in our system.', errorType: 'invalid' };
        }

        if (existingCard.userId === user.id) {
          return { success: false, message: 'You have already claimed this card.', errorType: 'already_claimed_by_you' };
        }

        return { success: false, message: 'This card has already been claimed by someone else.', errorType: 'already_claimed' };
      }

      return { success: true };
    });

    if (result.success) {
      revalidatePath('/dashboard');
      revalidatePath(`/n/${sanitizedUid}`);
    }

    return result as ClaimResult;

  } catch (error) {
    console.error('Failed to claim card:', error);
    return { success: false, message: 'An unexpected error occurred. Please try again.', errorType: 'server_error' };
  }
}
