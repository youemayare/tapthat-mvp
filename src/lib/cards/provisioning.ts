import { db } from '@/lib/db';
import { cards } from '@/lib/db/schema';
import { inArray } from 'drizzle-orm';

export interface RawCardItem {
  uid: string;
  cardType?: string;
  label?: string;
}

export interface IngestItemResult {
  uid: string;
  status: 'inserted' | 'skipped_claimed' | 'skipped_existing' | 'invalid';
  reason?: string;
  cardType?: string;
}

export interface IngestBatchResult {
  total: number;
  inserted: number;
  skippedClaimed: number;
  skippedExisting: number;
  invalid: number;
  items: IngestItemResult[];
}

/**
 * Normalizes a raw UID string:
 * - Trims whitespace
 * - Strips colons, spaces, hyphens
 * - Uppercases
 */
export function normalizeCardUid(rawUid: string): string {
  if (!rawUid) return '';
  return rawUid
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');
}

/**
 * Validates a normalized UID string:
 * - Must be alphanumeric
 * - Must be between 8 and 64 characters (covers standard 7-byte NTAG215 UIDs and long tokens)
 */
export function isValidCardUid(uid: string): boolean {
  return /^[A-Z0-9]{8,64}$/.test(uid);
}

/**
 * Ingests a batch of card UIDs into the database with idempotent protection:
 * - Invalid UIDs are flagged and skipped.
 * - Cards already claimed/active in the DB are PROTECTED and skipped (never unlinked).
 * - Cards already present as 'unclaimed' are noted and skipped (idempotent).
 * - New UIDs are inserted as 'unclaimed' with the designated cardType.
 */
export async function ingestCardsBatch(
  rawItems: RawCardItem[],
  defaultCardType: string = 'metal'
): Promise<IngestBatchResult> {
  const result: IngestBatchResult = {
    total: rawItems.length,
    inserted: 0,
    skippedClaimed: 0,
    skippedExisting: 0,
    invalid: 0,
    items: [],
  };

  if (rawItems.length === 0) {
    return result;
  }

  // 1. First-pass parsing and deduplication in the input batch
  const validMap = new Map<string, { cardType: string; label?: string }>();

  for (const item of rawItems) {
    const cleanUid = normalizeCardUid(item.uid);

    if (!isValidCardUid(cleanUid)) {
      result.invalid++;
      result.items.push({
        uid: item.uid || '(empty)',
        status: 'invalid',
        reason: 'UID must be 8-64 alphanumeric characters (e.g. 045BD2AA1B1291)',
      });
      continue;
    }

    if (validMap.has(cleanUid)) {
      // Duplicate inside the same upload file
      result.items.push({
        uid: cleanUid,
        status: 'skipped_existing',
        reason: 'Duplicate entry in input batch',
      });
      result.skippedExisting++;
      continue;
    }

    const type = (item.cardType?.toLowerCase() || defaultCardType.toLowerCase()).trim();
    validMap.set(cleanUid, {
      cardType: type || 'metal',
      label: item.label?.trim() || undefined,
    });
  }

  const uidsToCheck = Array.from(validMap.keys());
  if (uidsToCheck.length === 0) {
    return result;
  }

  // 2. Query DB in chunks of 500 to check for existing records
  const existingCards = new Map<string, { status: string; userId: string | null }>();
  const CHUNK_SIZE = 500;

  for (let i = 0; i < uidsToCheck.length; i += CHUNK_SIZE) {
    const chunk = uidsToCheck.slice(i, i + CHUNK_SIZE);
    const rows = await db
      .select({
        cardUid: cards.cardUid,
        status: cards.status,
        userId: cards.userId,
      })
      .from(cards)
      .where(inArray(cards.cardUid, chunk));

    for (const row of rows) {
      existingCards.set(row.cardUid, {
        status: row.status,
        userId: row.userId,
      });
    }
  }

  // 3. Separate into cards to insert vs cards to skip
  const toInsert: Array<{
    cardUid: string;
    cardType: string;
    label?: string;
    status: 'unclaimed';
  }> = [];

  for (const [uid, meta] of validMap.entries()) {
    const existing = existingCards.get(uid);

    if (existing) {
      if (existing.status !== 'unclaimed' || existing.userId !== null) {
        // Card is already active or owned by a user: Protect it!
        result.skippedClaimed++;
        result.items.push({
          uid,
          status: 'skipped_claimed',
          cardType: meta.cardType,
          reason: `Card is already active (${existing.status}) and claimed by a user. Skipped to prevent overwrite.`,
        });
      } else {
        // Card is already in stock as unclaimed
        result.skippedExisting++;
        result.items.push({
          uid,
          status: 'skipped_existing',
          cardType: meta.cardType,
          reason: 'Card already exists in database as unclaimed inventory.',
        });
      }
    } else {
      toInsert.push({
        cardUid: uid,
        cardType: meta.cardType,
        label: meta.label,
        status: 'unclaimed',
      });
    }
  }

  // 4. Batch insert new cards
  if (toInsert.length > 0) {
    for (let i = 0; i < toInsert.length; i += CHUNK_SIZE) {
      const chunk = toInsert.slice(i, i + CHUNK_SIZE);
      await db.insert(cards).values(chunk);
    }

    result.inserted = toInsert.length;
    for (const item of toInsert) {
      result.items.push({
        uid: item.cardUid,
        status: 'inserted',
        cardType: item.cardType,
      });
    }
  }

  return result;
}

/**
 * Parses raw text or CSV content into IngestItem array.
 * Supports:
 * - Line-delimited raw UIDs (e.g. from USB reader or barcode scanner)
 * - CSV with columns: UID, [cardType], [label] (header row automatically detected)
 */
export function parseUidInput(rawContent: string, fallbackType: string = 'metal'): RawCardItem[] {
  const lines = rawContent
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length === 0) return [];

  const items: RawCardItem[] = [];
  let startIndex = 0;

  // Check if first line is a CSV header
  const firstLineLower = lines[0].toLowerCase();
  if (
    firstLineLower.includes('uid') ||
    firstLineLower.includes('serial') ||
    firstLineLower.includes('card_uid') ||
    firstLineLower.includes('id')
  ) {
    startIndex = 1;
  }

  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i];
    // Split by comma or semicolon
    const parts = line.split(/[,;\t]/).map((p) => p.trim());
    const uid = parts[0];
    const cardType = parts[1] || fallbackType;
    const label = parts[2] || undefined;

    if (uid) {
      items.push({ uid, cardType, label });
    }
  }

  return items;
}
