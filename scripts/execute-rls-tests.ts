import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.staging' });

import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import { eq, sql } from 'drizzle-orm';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function runTests() {
  const { db } = await import('../src/lib/db');
  const { withRlsUser } = await import('../src/lib/db/auth-wrapper');
  const { profiles, cards, tapEvents, connections, users: dbUsers } = await import('../src/lib/db/schema');

  console.log('🔄 Starting RLS Isolation and Pooling Tests against Staging DB...\n');
  let passed = 0;
  let failed = 0;

  // 1. Setup Test Users
  const userA_id = uuidv4();
  const userB_id = uuidv4();
  
  const userA = { id: userA_id, app_metadata: {}, user_metadata: {}, aud: 'authenticated', created_at: '' };
  const userB = { id: userB_id, app_metadata: {}, user_metadata: {}, aud: 'authenticated', created_at: '' };

  try {
    // Insert into public.users (Simulating auth.users trigger)
    await db.insert(dbUsers).values([
      { id: userA_id, email: 'test-a@tapthat.local' },
      { id: userB_id, email: 'test-b@tapthat.local' }
    ]);
    console.log('✅ Created test users A and B.');

    // 2. Test User Isolation (Profiles)
    const insertA = await withRlsUser(userA, async (tx) => {
      return await tx.insert(profiles).values({
        id: uuidv4(),
        userId: userA_id,
        firstName: 'UserA',
        isPublished: false
      }).returning();
    });
    console.log('Insert A result:', insertA);

    const insertB = await withRlsUser(userB, async (tx) => {
      return await tx.insert(profiles).values({
        id: uuidv4(),
        userId: userB_id,
        firstName: 'UserB',
        isPublished: false
      }).returning();
    });
    console.log('Insert B result:', insertB);

    const allProfiles = await db.select().from(profiles).where(eq(profiles.userId, userA_id));
    console.log('Direct DB query for User A Profile:', allProfiles);

    // Test: User A can read User A's profile
    let result = await withRlsUser(userA, async (tx) => {
      return await tx.select().from(profiles).where(eq(profiles.userId, userA_id));
    });
    if (result.length === 1 && result[0].firstName === 'UserA') {
      console.log('✅ TEST PASSED: User A can read their own profile.');
      passed++;
    } else {
      console.error('❌ TEST FAILED: User A cannot read their own profile. Expected UserA, got:', result);
      failed++;
    }

    // Test: User A CANNOT read User B's profile
    result = await withRlsUser(userA, async (tx) => {
      return await tx.select().from(profiles).where(eq(profiles.userId, userB_id));
    });
    if (result.length === 0) {
      console.log('✅ TEST PASSED: User A cannot read User B\'s profile (RLS Enforced).');
      passed++;
    } else {
      console.error('❌ TEST FAILED: User A CAN read User B\'s profile! Leak detected!');
      failed++;
    }

    // Test: Pooling Context Leak
    console.log('\n🔄 Running Concurrent Pooling Context Leak Test (50 requests each)...');
    const promises = [];
    let leakDetected = false;

    for (let i = 0; i < 50; i++) {
      // User A Request
      promises.push(withRlsUser(userA, async (tx) => {
        const res = await tx.select().from(profiles);
        if (res.some(p => p.userId === userB_id)) leakDetected = true;
      }));

      // User B Request
      promises.push(withRlsUser(userB, async (tx) => {
        const res = await tx.select().from(profiles);
        if (res.some(p => p.userId === userA_id)) leakDetected = true;
      }));
    }

    await Promise.all(promises);

    if (!leakDetected) {
      console.log('✅ TEST PASSED: No context leaks detected under concurrent load.');
      passed++;
    } else {
      console.error('❌ TEST FAILED: Context leak detected under concurrent load!');
      failed++;
    }

    // Test: Public routes bypass RLS
    console.log('\n🔄 Testing public profile visibility...');
    const pubId = uuidv4();
    await withRlsUser(userA, async (tx) => {
      await tx.insert(profiles).values({
        id: pubId,
        userId: userA_id,
        firstName: 'PublicA',
        isPublished: true
      });
    });

    result = await withRlsUser(null, async (tx) => { // Anonymous user
      return await tx.select().from(profiles).where(eq(profiles.id, pubId));
    });
    if (result.length === 1 && result[0].firstName === 'PublicA') {
      console.log('✅ TEST PASSED: Anonymous user can view published profile.');
      passed++;
    } else {
      console.error('❌ TEST FAILED: Anonymous user cannot view published profile. Got:', result);
      failed++;
    }

  } catch (err) {
    console.error('🔥 Test execution encountered an error:', err);
    failed++;
  } finally {
    // Cleanup
    console.log('\n🧹 Cleaning up test data...');
    await db.delete(dbUsers).where(eq(dbUsers.id, userA_id));
    await db.delete(dbUsers).where(eq(dbUsers.id, userB_id));
    
    console.log(`\n📊 RESULTS: ${passed} Passed | ${failed} Failed`);
    process.exit(failed > 0 ? 1 : 0);
  }
}

runTests();
