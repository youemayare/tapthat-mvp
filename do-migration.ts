import { readFileSync } from 'fs';
import { db } from './src/lib/db';
import { sql } from 'drizzle-orm';
import path from 'path';

async function main() {
  console.log('Reading migration...');
  const migrationPath = path.join(process.cwd(), 'src/lib/db/migrations/0011_red_pyro.sql');
  const sqlString = readFileSync(migrationPath, 'utf8');

  // Split by statement-breakpoint
  const statements = sqlString.split('--> statement-breakpoint').map(s => s.trim()).filter(s => s.length > 0);

  console.log(`Found ${statements.length} statements.`);

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    console.log(`Executing statement ${i + 1}/${statements.length}...`);
    try {
      await db.execute(sql.raw(statement));
    } catch (error) {
      console.error(`Error executing statement ${i + 1}:`, error);
      console.error(statement);
      process.exit(1);
    }
  }

  console.log('Migration completed successfully!');
  process.exit(0);
}

main().catch(console.error);
