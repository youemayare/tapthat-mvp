import { createClient } from '@supabase/supabase-js';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '../src/lib/db/schema';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const dbUrl = process.env.DATABASE_URL!;

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const pool = new Pool({ connectionString: dbUrl });
const db = drizzle(pool, { schema });

async function seed() {
  console.log('1. Creating employer auth user...');
  const email = 'employer@anoya.ae';
  const password = 'AnoyaDemo2026!';
  let userId: string;
  const { data: existingUser } = await supabase.auth.admin.listUsers();
  const user = existingUser?.users.find((u: any) => u.email === email);
  if (user) {
    userId = user.id;
  } else {
    const { data: newUser } = await supabase.auth.admin.createUser({
      email, password, email_confirm: true, user_metadata: { full_name: 'Anoya Employer' },
    });
    userId = newUser.user!.id;
  }

  const [publicUser] = await db.select().from(schema.users).where(eq(schema.users.id, userId));
  if (!publicUser) {
    await db.insert(schema.users).values({ id: userId, email, fullName: 'Anoya Employer' });
  }

  const [existingProfile] = await db.select().from(schema.profiles).where(eq(schema.profiles.userId, userId));
  let profileId = existingProfile?.id;
  if (!profileId) {
    const [newProfile] = await db.insert(schema.profiles).values({
      userId, isDefault: true, firstName: 'Anoya', lastName: 'Employer',
      jobTitle: 'Hiring Manager', companyName: 'Anoya Digital',
      bio: 'Demonstrating the power of the Anoya NFC platform.',
      label: 'Main Profile', slug: 'anoya-demo', email: 'employer@anoya.ae',
      phone: '+971 50 123 4567', websiteUrl: 'https://anoya.ae',
      walletThemeColor: '#000000', isPublished: true,
    }).returning({ id: schema.profiles.id });
    profileId = newProfile.id;
  }

  const dummyUid = 'ANOYA-DEMO-001';
  const [existingCard] = await db.select().from(schema.cards).where(eq(schema.cards.cardUid, dummyUid));
  let cardId = existingCard?.id;
  if (!cardId) {
    const [newCard] = await db.insert(schema.cards).values({
      cardUid: dummyUid, userId, profileId: profileId,
      cardType: 'metal', status: 'active',
      activatedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    }).returning({ id: schema.cards.id });
    cardId = newCard.id;
  }

  console.log('4. Generating 30 days of analytics...');
  await db.delete(schema.tapEvents).where(eq(schema.tapEvents.cardId, cardId));
  await db.delete(schema.contactSaves).where(eq(schema.contactSaves.profileId, profileId));

  const now = new Date();
  const tapEvents = [];
  const contactSaves = [];

  for (let i = 29; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    date.setHours(0, 0, 0, 0);

    let dailyViews = Math.floor(Math.random() * 20) + 5;
    if (i % 7 === 0) dailyViews += 25; 
    
    for (let j = 0; j < dailyViews; j++) {
      const tapTime = new Date(date.getTime() + Math.random() * 24 * 60 * 60 * 1000);
      tapEvents.push({
        cardId,
        profileId,
        ipHash: randomUUID(),
        userAgent: Math.random() > 0.5 ? 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X)' : 'Mozilla/5.0 (Linux; Android 13; SM-S918B)',
        country: Math.random() > 0.1 ? 'AE' : (Math.random() > 0.5 ? 'US' : 'GB'),
        city: Math.random() > 0.1 ? 'Dubai' : 'Abu Dhabi',
        deviceType: Math.random() > 0.7 ? 'desktop' : 'mobile',
        os: Math.random() > 0.5 ? 'iOS' : 'Android',
        browser: Math.random() > 0.5 ? 'Safari' : 'Chrome',
        referrer: Math.random() > 0.8 ? 'https://linkedin.com' : 'direct',
        createdAt: tapTime,
      });
      
      if (Math.random() > 0.8) {
        contactSaves.push({
          profileId,
          createdAt: new Date(tapTime.getTime() + 10000),
        });
      }
    }
  }

  console.log(`Inserting ${tapEvents.length} tap events...`);
  const chunkSize = 50;
  for (let i = 0; i < tapEvents.length; i += chunkSize) {
    await db.insert(schema.tapEvents).values(tapEvents.slice(i, i + chunkSize));
  }
  console.log(`Inserting ${contactSaves.length} contact saves...`);
  for (let i = 0; i < contactSaves.length; i += chunkSize) {
    await db.insert(schema.contactSaves).values(contactSaves.slice(i, i + chunkSize));
  }

  console.log('\n--- SUCCESS ---');
  console.log(`Email: employer@anoya.ae`);
  console.log(`Password: AnoyaDemo2026!`);
  console.log(`Profile: https://tapthat.vercel.app/p/anoya-demo`);
  console.log(`Card Routing URL: https://tapthat.vercel.app/n/ANOYA-DEMO-001`);

  process.exit(0);
}

seed().catch(console.error);
