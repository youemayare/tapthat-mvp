import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.staging' });

async function setupTrigger() {
  const { db } = await import('../src/lib/db');
  const { sql } = await import('drizzle-orm');

  console.log('🔄 Setting up auth.users trigger on staging database...');

  try {
    // 1. Create the function
    await db.execute(sql`
      CREATE OR REPLACE FUNCTION public.handle_new_user()
      RETURNS trigger
      LANGUAGE plpgsql
      SECURITY DEFINER SET search_path = ''
      AS $$
      BEGIN
        INSERT INTO public.users (id, email, full_name, created_at, updated_at)
        VALUES (
          new.id,
          new.email,
          new.raw_user_meta_data->>'full_name',
          new.created_at,
          new.updated_at
        );
        RETURN new;
      END;
      $$;
    `);

    // 2. Drop the trigger if it exists
    await db.execute(sql`
      DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
    `);

    // 3. Create the trigger
    await db.execute(sql`
      CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
    `);

    // 4. Backfill any existing users in auth.users to public.users
    await db.execute(sql`
      INSERT INTO public.users (id, email, created_at, updated_at)
      SELECT id, email, created_at, updated_at
      FROM auth.users
      WHERE NOT EXISTS (
        SELECT 1 FROM public.users WHERE public.users.id = auth.users.id
      );
    `);

    console.log('✅ Auth trigger successfully created and users backfilled!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to set up trigger:', error);
    process.exit(1);
  }
}

setupTrigger();
