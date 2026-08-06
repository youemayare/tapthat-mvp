import { parseArgs } from 'node:util';
import { db } from '../src/lib/db';
import { tapEvents, cards } from '../src/lib/db/schema';
import { eq } from 'drizzle-orm';
import { randomUUID, createHash } from 'crypto';

const { values } = parseArgs({
  args: process.argv.slice(2),
  options: {
    profile: {
      type: 'string',
      short: 'p',
    },
    clear: {
      type: 'boolean',
      short: 'c',
    },
    force: {
      type: 'boolean',
      short: 'f',
    },
  },
});

async function run() {
  const profileId = values.profile;
  if (!profileId) {
    console.error('Usage: npx tsx scripts/seed-analytics.ts --profile=<profile-id> [--clear] [--force]');
    process.exit(1);
  }

  // Safety check
  const isLocal = process.env.DATABASE_URL?.includes('localhost') || process.env.DATABASE_URL?.includes('127.0.0.1');
  if (!isLocal && !values.force) {
    console.error('ERROR: You are targeting a non-local database.');
    console.error('Use --force if you are absolutely sure you want to run this in production.');
    process.exit(1);
  }

  // Get a card for this profile
  const cardRows = await db.select().from(cards).where(eq(cards.profileId, profileId)).limit(1);
  const card = cardRows[0];
  if (!card) {
    console.error(`ERROR: No active cards found for profile ${profileId}.`);
    process.exit(1);
  }

  if (values.clear) {
    console.log('Clearing existing tap events for profile...');
    await db.delete(tapEvents).where(eq(tapEvents.profileId, profileId));
  }

  console.log('Seeding analytics data...');
  
  const events = [];
  const now = new Date();
  
  // Weights setup
  const pickWeighted = <T>(options: { val: T, w: number }[]) => {
    const total = options.reduce((sum, o) => sum + o.w, 0);
    let r = Math.random() * total;
    for (const option of options) {
      if (r < option.w) return option.val;
      r -= option.w;
    }
    return options[0].val;
  };

  const devices: {val: 'mobile'|'desktop'|'tablet', w: number}[] = [
    { val: 'mobile', w: 65 },
    { val: 'desktop', w: 30 },
    { val: 'tablet', w: 5 }
  ];

  const browsers = [
    { val: 'Safari', w: 45 },
    { val: 'Chrome', w: 40 },
    { val: 'Firefox', w: 8 },
    { val: 'Edge', w: 5 },
    { val: 'Unknown', w: 2 }
  ];

  const countries = [
    { val: 'AE', w: 40 }, // UAE
    { val: 'US', w: 25 }, // USA
    { val: 'GB', w: 15 }, // UK
    { val: 'SA', w: 10 }, // Saudi Arabia
    { val: 'IN', w: 5 },  // India
    { val: 'Unknown', w: 5 }
  ];

  const osMap: Record<string, string[]> = {
    mobile: ['iOS', 'Android'],
    desktop: ['macOS', 'Windows', 'Linux'],
    tablet: ['iOS', 'Android']
  };

  // Generate 30 days of data
  for (let i = 0; i < 30; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    
    // Base traffic: 1 to 5 taps per day
    let dailyTaps = Math.floor(Math.random() * 5) + 1;
    
    // Add a couple spikes
    if (i === 4 || i === 12) {
      dailyTaps += 20; // Traffic spike
    }

    for (let j = 0; j < dailyTaps; j++) {
      // Randomize hour of day
      const eventTime = new Date(d);
      eventTime.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60));

      const deviceType = pickWeighted(devices);
      const osChoices = osMap[deviceType];
      const os = osChoices[Math.floor(Math.random() * osChoices.length)];
      const browser = pickWeighted(browsers);
      const country = pickWeighted(countries);
      
      const ip = `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
      const dateStr = eventTime.toISOString().split('T')[0];
      const ipHash = createHash('sha256').update(`${ip}:${dateStr}`).digest('hex');

      // 80% are unique visitors (no session ID)
      const isUnique = Math.random() > 0.2;
      const sessionId = isUnique ? null : randomUUID();

      events.push({
        cardId: card.id,
        profileId,
        ipHash,
        country: country === 'Unknown' ? null : country, // DB expects ISO or null
        city: null, // We'll keep city null for this simple seed
        deviceType,
        os,
        browser,
        referrer: Math.random() > 0.5 ? 'https://google.com' : null,
        sessionId,
        isUnique,
        tappedAt: eventTime
      });
    }
  }

  // Insert in batches of 50
  const BATCH_SIZE = 50;
  for (let i = 0; i < events.length; i += BATCH_SIZE) {
    const batch = events.slice(i, i + BATCH_SIZE);
    await db.insert(tapEvents).values(batch);
  }

  console.log(`Successfully seeded ${events.length} tap events!`);
  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
