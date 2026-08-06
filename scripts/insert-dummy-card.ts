import { db } from '../src/lib/db';
import { cards } from '../src/lib/db/schema';

async function run() {
  await db.insert(cards).values({
    cardUid: 'TESTUID123',
    status: 'unclaimed'
  }).onConflictDoNothing();
  
  console.log('Inserted dummy card TESTUID123');
  process.exit(0);
}

run();
