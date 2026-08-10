import { db } from './src/lib/db';
import { connections, profiles } from './src/lib/db/schema';
import { eq } from 'drizzle-orm';
import { withRlsUser } from './src/lib/db/auth-wrapper';

async function testConnection() {
  const email = 'umarsoorty8@gmail.com'; // This is the user trying to save
  const targetEmail = 'umarsoorty1@gmail.com'; // This is the user being saved (or vice versa, let's just pick any two)
  
  // Actually, umarsoorty1@gmail.com is saving umarsoorty8@gmail.com
  const viewerEmail = 'umarsoorty1@gmail.com';
  const targetUserEmail = 'umarsoorty8@gmail.com';
  
  // Get viewer user ID
  const viewer = await db.query.users.findFirst({ where: (u, { eq }) => eq(u.email, viewerEmail) });
  if (!viewer) throw new Error('Viewer not found');
  
  // Get target user ID and profile
  const targetUser = await db.query.users.findFirst({ where: (u, { eq }) => eq(u.email, targetUserEmail) });
  if (!targetUser) throw new Error('Target user not found');
  
  const targetProfile = await db.query.profiles.findFirst({ where: (p, { eq }) => eq(p.userId, targetUser.id) });
  if (!targetProfile) throw new Error('Target profile not found');
  
  console.log('Target profile:', targetProfile.id, 'isPublished:', targetProfile.isPublished);
  
  // Try inserting directly
  try {
    await db.insert(connections).values({
      viewerUserId: viewer.id,
      profileId: targetProfile.id,
    });
    console.log('Direct insert successful');
  } catch (e) {
    console.error('Direct insert failed:', e);
  }
  
  process.exit(0);
}

testConnection().catch(console.error);
