import { db } from './src/lib/db';
import { profiles, tapEvents, cards, connections } from './src/lib/db/schema';
import { eq, inArray } from 'drizzle-orm';

async function checkAnalytics() {
  const targetEmail = 'umarsoorty8@gmail.com';
  const targetUser = await db.query.users.findFirst({ where: (u, { eq }) => eq(u.email, targetEmail) });
  
  if (!targetUser) throw new Error('Target user not found');
  
  console.log(`User: ${targetUser.id}`);
  
  const userProfiles = await db.select().from(profiles).where(eq(profiles.userId, targetUser.id));
  const userCards = await db.select().from(cards).where(eq(cards.userId, targetUser.id));
  
  console.log(`\n--- Profiles ---`);
  for (const p of userProfiles) {
    console.log(`Profile: ${p.id} | Label: ${p.label} | Title: ${p.jobTitle}`);
  }
  
  console.log(`\n--- Cards ---`);
  for (const c of userCards) {
    console.log(`Card: ${c.id} | Uid: ${c.cardUid} | Linked Profile: ${c.profileId}`);
  }
  
  console.log(`\n--- Tap Events ---`);
  const profileIds = userProfiles.map(p => p.id);
  const cardIds = userCards.map(c => c.id);
  
  let taps = [];
  if (profileIds.length > 0 || cardIds.length > 0) {
    taps = await db.select().from(tapEvents).where(
      cardIds.length > 0 && profileIds.length > 0
        ? inArray(tapEvents.profileId, profileIds) // Wait, let's just fetch all taps for user's profiles OR cards
        : profileIds.length > 0 ? inArray(tapEvents.profileId, profileIds) : inArray(tapEvents.cardId, cardIds)
    );
    
    // Also fetch taps by cardIds
    if (cardIds.length > 0) {
      const moreTaps = await db.select().from(tapEvents).where(inArray(tapEvents.cardId, cardIds));
      // merge unique
      const existingIds = new Set(taps.map(t => t.id));
      for (const t of moreTaps) {
        if (!existingIds.has(t.id)) taps.push(t);
      }
    }
  }
  
  for (const t of taps) {
    console.log(`Tap: ${t.id} | profileId: ${t.profileId} | cardId: ${t.cardId}`);
  }
  
  console.log(`\n--- Connections (Profile Saves) ---`);
  if (profileIds.length > 0) {
    const saves = await db.select().from(connections).where(inArray(connections.profileId, profileIds));
    for (const s of saves) {
      console.log(`Save: ${s.id} | viewer: ${s.viewerUserId} | profileId: ${s.profileId}`);
    }
  }
  
  process.exit(0);
}

checkAnalytics().catch(console.error);
