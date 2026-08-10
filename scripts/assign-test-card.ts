import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.staging' });

async function assignCard() {
  const { db } = await import('../src/lib/db');
  const { users, cards, profiles } = await import('../src/lib/db/schema');
  const { v4: uuidv4 } = await import('uuid');
  const { eq, desc } = await import('drizzle-orm');

  console.log('🔄 Finding newest user to assign card...');
  
  try {
    const allUsers = await db.select().from(users).orderBy(desc(users.createdAt)).limit(1);
    
    if (allUsers.length === 0) {
      console.error('❌ No users found in the database. Please sign up first.');
      process.exit(1);
    }
    
    const user = allUsers[0];
    console.log(`👤 Found user: ${user.email} (${user.id})`);

    // 1. Create a default profile if one doesn't exist
    const userProfiles = await db.select().from(profiles).where(eq(profiles.userId, user.id));
    let profileId;
    
    if (userProfiles.length === 0) {
      console.log('📝 Creating default profile for user...');
      profileId = uuidv4();
      await db.insert(profiles).values({
        id: profileId,
        userId: user.id,
        firstName: 'Test',
        lastName: 'User',
        isDefault: true,
        isPublished: true,
      });
    } else {
      profileId = userProfiles[0].id;
    }

    // 2. Assign a test card
    const cardUid = `test-card-${Math.floor(Math.random() * 10000)}`;
    console.log(`💳 Assigning card (UID: ${cardUid}) to user...`);
    
    await db.insert(cards).values({
      id: uuidv4(),
      cardUid: cardUid,
      userId: user.id,
      profileId: profileId,
      status: 'active',
      cardType: 'pvc'
    });

    console.log('✅ Successfully assigned test card!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

assignCard();
