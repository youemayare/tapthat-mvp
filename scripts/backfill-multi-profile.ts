/**
 * Backfill script for the multi-profile feature.
 *
 * What it does:
 * - Sets is_default = true on the FIRST profile (by created_at) for each user
 *   who has at least one profile but no profile with is_default = true.
 * - Sets label = 'Default' where label is null on those profiles.
 *
 * This is idempotent: running it multiple times is safe.
 *
 * Usage:
 *   npx tsx scripts/backfill-multi-profile.ts
 *
 * Safety:
 * - Does NOT delete anything.
 * - Does NOT modify any production routing or card assignments.
 * - Only touches the `profiles.is_default` and `profiles.label` columns,
 *   which are new additive columns. All existing functionality is unaffected
 *   whether or not this script has run, since the feature flag remains false.
 */
import { config } from 'dotenv';
config({ path: '.env.local' });

import { eq } from 'drizzle-orm';

async function main() {
  const { db } = await import('../src/lib/db');
  const { profiles } = await import('../src/lib/db/schema');
  
  console.log('Starting multi-profile backfill...\n');

  // 1. Find all users who have profiles with no is_default=true set
  const allProfiles = await db
    .select({ id: profiles.id, userId: profiles.userId, isDefault: profiles.isDefault, label: profiles.label })
    .from(profiles)
    .orderBy(profiles.userId, profiles.createdAt);

  // Group by userId
  const byUser = new Map<string, typeof allProfiles>();
  for (const p of allProfiles) {
    if (!byUser.has(p.userId)) byUser.set(p.userId, []);
    byUser.get(p.userId)!.push(p);
  }

  let updated = 0;
  let skipped = 0;

  for (const [userId, userProfiles] of byUser.entries()) {
    const hasDefault = userProfiles.some((p) => p.isDefault);

    if (hasDefault) {
      skipped++;
      continue;
    }

    // Mark the first profile (earliest created) as the default
    const firstProfile = userProfiles[0];
    await db
      .update(profiles)
      .set({
        isDefault: true,
        label: firstProfile.label ?? 'Default',
        updatedAt: new Date(),
      })
      .where(eq(profiles.id, firstProfile.id));

    updated++;
    console.log(`  ✅ User ${userId}: profile ${firstProfile.id} marked as default`);
  }

  console.log(`\nBackfill complete.`);
  console.log(`  Updated: ${updated} profiles`);
  console.log(`  Skipped (already had default): ${skipped} users`);
  process.exit(0);
}

main().catch((err) => {
  console.error('Backfill failed:', err);
  process.exit(1);
});

