import { db } from './src/lib/db';
import { users } from './src/lib/db/schema';
import { eq } from 'drizzle-orm';

async function testUsers() {
  const email1 = 'umarsoorty1@gmail.com';
  
  // Find user
  const user1 = await db.query.users.findFirst({ where: (u, { eq }) => eq(u.email, email1) });
  console.log(`User1 (${email1}):`, user1);
  
  if (!user1) {
    console.log('User1 is not in the users table! This means the foreign key constraint WILL FAIL if self-healing fails.');
    
    // Simulate self-healing
    try {
      await db.insert(users).values({
        id: 'some-fake-uuid-0000-0000-0000-00000000', // We don't have the real Supabase ID here, but if we did
        email: email1,
      }).onConflictDoNothing();
      console.log('Self-healing simulated success (it would work).');
    } catch (e) {
      console.error('Self-healing simulated failed:', e);
    }
  } else {
    // If they ARE in the users table, then the FK should not fail on viewerUserId.
    console.log('User1 is already in the users table. ID:', user1.id);
  }
  
  process.exit(0);
}

testUsers().catch(console.error);
