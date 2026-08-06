import { config } from 'dotenv';
config({ path: '.env.local' });
import { db } from '../src/lib/db';
import { cards } from '../src/lib/db/schema';
import { eq } from 'drizzle-orm';

async function main() {
  const testUid = 'MYTESTCARD123';
  
  const existing = await db.select().from(cards).where(eq(cards.cardUid, testUid));
  if (existing.length === 0) {
    await db.insert(cards).values({
      cardUid: testUid,
      status: 'unclaimed'
    });
    console.log(`✅ Successfully seeded test card: ${testUid}`);
  } else {
    // If it's already claimed by someone in testing, let's reset it to unclaimed so they can claim it.
    await db.update(cards).set({
      status: 'unclaimed',
      userId: null,
      profileId: null,
      activatedAt: null,
    }).where(eq(cards.cardUid, testUid));
    console.log(`✅ Successfully reset existing test card: ${testUid}`);
  }
}

main().catch(console.error).finally(() => process.exit(0));
