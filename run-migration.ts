import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.staging' });
import { db } from './src/lib/db';
import { sql } from 'drizzle-orm';
import * as fs from 'fs';
import * as path from 'path';

async function run() {
  try {
    const sqlContent = fs.readFileSync(path.join(__dirname, 'src/lib/db/migrations/0001_enable_rls.sql'), 'utf-8');
    await db.execute(sql.raw(sqlContent));
    console.log("Migration executed successfully!");
  } catch (err) {
    console.error("Migration Error:", err);
  }
  process.exit(0);
}
run();
