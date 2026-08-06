import { loadEnvConfig } from '@next/env';
import { db } from './src/lib/db/index.js';
import { profiles } from './src/lib/db/schema.js';

async function check() {
  loadEnvConfig(process.cwd());
  const allProfiles = await db.select().from(profiles);
  console.log('Total profiles:', allProfiles.length);
  if (allProfiles.length > 0) {
    console.log('Sample profile:', allProfiles[0]);
  }
}

check().catch(console.error).finally(() => process.exit(0));
