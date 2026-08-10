import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.staging' });
import { sql } from 'drizzle-orm';

async function check() {
  const { db } = await import('../src/lib/db');
  const u = await db.execute(sql`SELECT count(*) from users`);
  const p = await db.execute(sql`SELECT count(*) from profiles`);
  const c = await db.execute(sql`SELECT count(*) from cards`);
  console.log({
    users: u.rows[0].count,
    profiles: p.rows[0].count,
    cards: c.rows[0].count
  });
  process.exit(0);
}
check();
