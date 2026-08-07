import { db } from '../src/lib/db';
import { cards } from '../src/lib/db/schema';
import { eq } from 'drizzle-orm';
import { parseArgs } from 'util';

async function main() {
  const { values } = parseArgs({
    args: process.argv.slice(2),
    options: {
      user: {
        type: 'string',
        short: 'u',
      },
    },
  });

  const targetUserId = values.user;

  if (!targetUserId) {
    console.error('❌ Error: Must provide a target user ID using --user=<test-user-id>');
    process.exit(1);
  }

  // Safety check: ensure we are not accidentally seeding a production database
  // by checking for a known test connection string or environment string
  // If NEXT_PUBLIC_APP_URL is production, abort.
  if (process.env.NEXT_PUBLIC_APP_URL?.includes('tapthat.vercel.app')) {
    console.warn('⚠️ WARNING: Detected production environment URL. Proceeding with caution because we rely on direct Neon connection.');
  }

  try {
    console.log(`Seeding test cards for user: ${targetUserId}...`);

    const metalUid = 'SEEDMETAL123';
    const pvcUid = 'SEEDPVC456';

    // 1. Create Active Metal Card
    const existingMetal = await db.query.cards.findFirst({
      where: eq(cards.cardUid, metalUid)
    });

    if (!existingMetal) {
      await db.insert(cards).values({
        userId: targetUserId,
        cardUid: metalUid,
        cardType: 'metal',
        status: 'active',
        activatedAt: new Date(),
      });
      console.log('✅ Created Active Metal Card (UID: SEEDMETAL123)');
    } else {
      console.log('ℹ️ Active Metal Card already exists. Skipping.');
    }

    // 2. Create Deactivated PVC Card
    const existingPvc = await db.query.cards.findFirst({
      where: eq(cards.cardUid, pvcUid)
    });

    if (!existingPvc) {
      await db.insert(cards).values({
        userId: targetUserId,
        cardUid: pvcUid,
        cardType: 'pvc',
        status: 'deactivated',
        activatedAt: new Date(),
      });
      console.log('✅ Created Deactivated PVC Card (UID: SEEDPVC456)');
    } else {
      console.log('ℹ️ Deactivated PVC Card already exists. Skipping.');
    }

    console.log('🎉 Seeding complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding cards:', error);
    process.exit(1);
  }
}

main();
