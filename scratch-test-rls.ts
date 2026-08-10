import { db } from './src/lib/db';
import { connections } from './src/lib/db/schema';
import { inArray, sql } from 'drizzle-orm';
import { withRlsUser } from './src/lib/db/auth-wrapper';

async function testRls() {
  const targetEmail = 'umarsoorty8@gmail.com';
  const targetUser = await db.query.users.findFirst({ where: (u, { eq }) => eq(u.email, targetEmail) });
  if (!targetUser) throw new Error('Target user not found');
  
  const profileIds = ['9ec77271-a437-48f0-8d2f-705eaeb9260e', 'dbd3a61a-2c1a-4f04-a944-a47bfc09b91f', '043227a2-64ea-4a6a-86dd-59530ef7b9d4'];

  // Test outside RLS (superuser)
  const outside = await db.select({ count: sql<number>`count(*)` }).from(connections).where(inArray(connections.profileId, profileIds));
  console.log('Count Outside RLS:', Number(outside[0]?.count));

  // Test inside RLS
  const mockUser = { id: targetUser.id, email: targetUser.email, user_metadata: {} };
  await withRlsUser(mockUser as any, async (tx) => {
    const inside = await tx.select({ count: sql<number>`count(*)` }).from(connections).where(inArray(connections.profileId, profileIds));
    console.log('Count Inside RLS:', Number(inside[0]?.count));
  });

  process.exit(0);
}

testRls().catch(console.error);
