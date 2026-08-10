import { db } from './src/lib/db';
import { connections, profiles, tapEvents, cards, users } from './src/lib/db/schema';
import { eq, inArray, sql, or, and, isNull } from 'drizzle-orm';

async function checkAnalyticsQueries() {
  const targetEmail = 'umarsoorty8@gmail.com';
  const targetUser = await db.query.users.findFirst({ where: (u, { eq }) => eq(u.email, targetEmail) });
  if (!targetUser) throw new Error('Target user not found');
  const user = targetUser;

  const userProfiles = await db.select().from(profiles).where(eq(profiles.userId, user.id));
  const validProfiles = userProfiles;
  const profileIds = validProfiles.map(p => p.id);

  // For Student profile simulation:
  const studentProfile = validProfiles.find(p => p.label === 'Student' || p.jobTitle === 'Student');
  const selectedProfileId = studentProfile ? studentProfile.id : null;
  const selectedProfileIds = selectedProfileId ? [selectedProfileId] : profileIds;

  const cardsCondition = selectedProfileId
    ? inArray(cards.profileId, selectedProfileIds)
    : eq(cards.userId, user.id);
    
  const userCards = await db.select({ id: cards.id }).from(cards).where(cardsCondition);
  const cardIds = userCards.map(c => c.id);

  // Original Buggy Condition
  const buggyProfileTapsCondition = cardIds.length > 0
    ? or(inArray(tapEvents.profileId, selectedProfileIds), inArray(tapEvents.cardId, cardIds))
    : inArray(tapEvents.profileId, selectedProfileIds);

  const buggyTotalTapsResult = await db.select({ count: sql<number>`count(*)` })
    .from(tapEvents)
    .where(buggyProfileTapsCondition);
  
  // Fixed Condition
  const fixedProfileTapsCondition = cardIds.length > 0
    ? or(
        inArray(tapEvents.profileId, selectedProfileIds),
        and(isNull(tapEvents.profileId), inArray(tapEvents.cardId, cardIds))
      )
    : inArray(tapEvents.profileId, selectedProfileIds);

  const fixedTotalTapsResult = await db.select({ count: sql<number>`count(*)` })
    .from(tapEvents)
    .where(fixedProfileTapsCondition);

  console.log(`Student Profile Taps (Buggy):`, Number(buggyTotalTapsResult[0]?.count));
  console.log(`Student Profile Taps (Fixed):`, Number(fixedTotalTapsResult[0]?.count));

  // Connections (Profile Saves)
  const savesResult = await db.select({ count: sql<number>`count(*)` })
    .from(connections)
    .where(inArray(connections.profileId, profileIds));
  console.log(`Total Saves (All Profiles):`, Number(savesResult[0]?.count));

  // Connections for Student
  const savesStudentResult = await db.select({ count: sql<number>`count(*)` })
    .from(connections)
    .where(inArray(connections.profileId, selectedProfileIds));
  console.log(`Total Saves (Student Profile):`, Number(savesStudentResult[0]?.count));

  process.exit(0);
}

checkAnalyticsQueries().catch(console.error);
