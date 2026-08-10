import { db } from './src/lib/db';

async function checkProfiles() {
  const targetUserEmail = 'umarsoorty8@gmail.com';
  const targetUser = await db.query.users.findFirst({ where: (u, { eq }) => eq(u.email, targetUserEmail) });
  
  if (!targetUser) throw new Error('Target user not found');
  
  const targetProfiles = await db.query.profiles.findMany({ where: (p, { eq }) => eq(p.userId, targetUser.id) });
  
  for (const p of targetProfiles) {
    console.log(`Profile: ${p.id} - slug: ${p.slug} - title: ${p.jobTitle} - isPublished: ${p.isPublished}`);
  }
  process.exit(0);
}

checkProfiles().catch(console.error);
