import { db, Db } from './index';
import { sql } from 'drizzle-orm';
import { User } from '@supabase/supabase-js';

// Extract the transaction type from Drizzle
export type Transaction = Parameters<Parameters<Db['transaction']>[0]>[0];

export async function withRlsUser<T>(
  user: User | null | undefined,
  callback: (tx: Transaction) => Promise<T>
): Promise<T> {
  return await db.transaction(async (tx) => {
    if (user?.id) {
      // Authenticated user
      await tx.execute(sql`SELECT set_config('role', 'authenticated', true)`);
      const claims = JSON.stringify({ sub: user.id, role: 'authenticated' });
      await tx.execute(sql`SELECT set_config('request.jwt.claims', ${claims}, true)`);
    } else {
      // Anonymous user
      await tx.execute(sql`SELECT set_config('role', 'anon', true)`);
      const claims = JSON.stringify({ role: 'anon' });
      await tx.execute(sql`SELECT set_config('request.jwt.claims', ${claims}, true)`);
    }

    return await callback(tx);
  });
}
