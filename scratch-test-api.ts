import { db } from './src/lib/db';
import { connections, users, profiles } from './src/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { withRlsUser } from './src/lib/db/auth-wrapper';

async function testApi() {
  const viewerEmail = 'umarsoorty1@gmail.com';
  const targetEmail = 'umarsoorty8@gmail.com';
  
  // Get viewer user
  const viewer = await db.query.users.findFirst({ where: (u, { eq }) => eq(u.email, viewerEmail) });
  if (!viewer) throw new Error('Viewer not found');
  
  // Get target user
  const targetUser = await db.query.users.findFirst({ where: (u, { eq }) => eq(u.email, targetEmail) });
  if (!targetUser) throw new Error('Target user not found');
  
  // Get target profile (the one that is published)
  const targetProfile = await db.query.profiles.findFirst({ 
    where: (p, { eq, and }) => and(eq(p.userId, targetUser.id), eq(p.isPublished, true))
  });
  if (!targetProfile) throw new Error('Target profile not found');
  
  console.log(`Viewer: ${viewer.id}, Target Profile: ${targetProfile.id}`);
  
  // Create mock User object for withRlsUser
  const mockUser = {
    id: viewer.id,
    email: viewer.email,
    user_metadata: {},
  };
  
  // Simulate API route logic
  try {
    const result = await withRlsUser(mockUser as any, async (tx) => {
      // 1. self healing
      try {
        await tx.insert(users).values({
          id: mockUser.id,
          email: mockUser.email || '',
          fullName: null,
          avatarUrl: null,
        }).onConflictDoNothing();
        console.log('Self healing passed');
      } catch (e) {
        console.error('Self healing failed', e);
      }
      
      const profileId = targetProfile.id;
      
      // 2. verify profile
      const profile = await tx.query.profiles.findFirst({
        where: and(eq(profiles.id, profileId), eq(profiles.isPublished, true)),
      });
      
      if (!profile) {
        throw new Error('Profile not found - 404');
      }
      console.log('Profile verified');
      
      if (profile.userId === mockUser.id) {
        throw new Error('Cannot save your own profile - 400');
      }
      
      // 3. insert
      try {
        await tx.insert(connections).values({
          viewerUserId: mockUser.id,
          profileId,
        });
        return 'Success - 201';
      } catch (err: any) {
        if (err?.code === '23505') {
          return 'Already saved - 200';
        }
        console.error('Insert error', err);
        throw new Error('Failed to save connection - 500');
      }
    });
    console.log('Result:', result);
  } catch (e) {
    console.error('API Simulation failed:', e);
  }
  
  // Clean up the inserted connection
  await db.delete(connections).where(and(eq(connections.viewerUserId, viewer.id), eq(connections.profileId, targetProfile.id)));
  
  process.exit(0);
}

testApi().catch(console.error);
