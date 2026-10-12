import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
import { parseArgs } from 'util';

// Ensure .env.local is loaded
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function main() {
  const { values } = parseArgs({
    args: process.argv.slice(2),
    options: {
      file: {
        type: 'string',
        short: 'f',
      },
      uid: {
        type: 'string',
        short: 'u',
      },
      type: {
        type: 'string',
        short: 't',
        default: 'metal',
      },
      label: {
        type: 'string',
        short: 'l',
      },
    },
  });

  const { ingestCardsBatch, parseUidInput, normalizeCardUid } = await import(
    '../src/lib/cards/provisioning'
  );

  console.log('\n🎴 ========================================================');
  console.log('   TAYZ — NFC Hardware Provisioning & Ingestion CLI');
  console.log('========================================================\n');

  let itemsToIngest: Array<{ uid: string; cardType?: string; label?: string }> = [];
  const defaultType = values.type || 'metal';

  if (values.uid) {
    itemsToIngest.push({
      uid: values.uid,
      cardType: defaultType,
      label: values.label,
    });
    console.log(`🔹 Mode: Single UID Ingestion`);
    console.log(`🔹 UID:  ${normalizeCardUid(values.uid)}`);
    console.log(`🔹 Type: ${defaultType}\n`);
  } else if (values.file) {
    const filePath = path.resolve(process.cwd(), values.file);
    if (!fs.existsSync(filePath)) {
      console.error(`❌ Error: File not found at path: ${filePath}`);
      process.exit(1);
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    itemsToIngest = parseUidInput(content, defaultType);
    console.log(`🔹 Mode: Batch File Ingestion`);
    console.log(`🔹 File: ${path.basename(filePath)}`);
    console.log(`🔹 Total parsed lines: ${itemsToIngest.length}`);
    console.log(`🔹 Default Card Type: ${defaultType}\n`);
  } else {
    console.error('❌ Usage error. Provide either --file or --uid.');
    console.log('\nExamples:');
    console.log('  npx tsx scripts/ingest-cards.ts --uid=045BD2AA1B1291 --type=metal');
    console.log('  npx tsx scripts/ingest-cards.ts --file=cards.csv --type=metal\n');
    process.exit(1);
  }

  if (itemsToIngest.length === 0) {
    console.warn('⚠️ No card items found to process.');
    process.exit(0);
  }

  try {
    console.log('⏳ Provisioning cards into database...');
    const result = await ingestCardsBatch(itemsToIngest, defaultType);

    console.log('\n📊 Summary Report:');
    console.log('--------------------------------------------------------');
    console.log(`  Total Processed:         ${result.total}`);
    console.log(`  ✅ Successfully Added:   ${result.inserted}`);
    console.log(`  ℹ️ Already in Stock:     ${result.skippedExisting}`);
    console.log(`  🛡️ Already Active/User:  ${result.skippedClaimed}`);
    console.log(`  ❌ Invalid Format:       ${result.invalid}`);
    console.log('--------------------------------------------------------\n');

    if (result.inserted > 0) {
      console.log('✅ Newly provisioned UIDs:');
      const newlyInserted = result.items.filter((i) => i.status === 'inserted');
      newlyInserted.slice(0, 10).forEach((i) => {
        console.log(`   + [${i.cardType?.toUpperCase()}] ${i.uid}`);
      });
      if (newlyInserted.length > 10) {
        console.log(`   ... and ${newlyInserted.length - 10} more.`);
      }
      console.log('');
    }

    if (result.skippedClaimed > 0) {
      console.log('🛡️ Skipped active cards (prevented overwrite):');
      result.items
        .filter((i) => i.status === 'skipped_claimed')
        .slice(0, 5)
        .forEach((i) => console.log(`   ! ${i.uid} (${i.reason})`));
      console.log('');
    }

    if (result.invalid > 0) {
      console.log('❌ Invalid entries skipped:');
      result.items
        .filter((i) => i.status === 'invalid')
        .slice(0, 5)
        .forEach((i) => console.log(`   x ${i.uid}: ${i.reason}`));
      console.log('');
    }

    console.log('🎉 Done!\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Provisioning failed with error:', error);
    process.exit(1);
  }
}

main();
