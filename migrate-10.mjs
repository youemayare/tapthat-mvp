import { Pool } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function run() {
  console.log('Dropping profile_layout check constraint...');
  try {
    await pool.query('ALTER TABLE "profiles" DROP CONSTRAINT IF EXISTS "profiles_profile_layout_check";');
    console.log('Dropped.');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    pool.end();
  }
}
run();
