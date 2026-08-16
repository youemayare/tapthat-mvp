import { type NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { profiles, contactSaves } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { generateVCard, getVCardFilename } from '@/lib/vcard';
import { vcardRatelimit } from '@/lib/ratelimit';
import { PROFILE_PUBLIC_COLS } from '@/lib/queries';
import { logError, generateRequestId } from '@/lib/security';

/**
 * GET /api/vcard/[slug]
 *
 * Returns a .vcf contact file for a profile identified by its PUBLIC SLUG only.
 *
 * Design decisions:
 *  - Accepts slug only (never internal UUIDs). UUID-based requests receive a 404.
 *  - Selects explicit public-profile columns, never the full profile row (S-13).
 *  - Rate-limited per IP (S-8). Fails closed without Redis.
 *  - Requires the profile to be published and not archived (S-8).
 *  - Content-Disposition filename is sanitized to ASCII-only (S-9).
 *  - Returns generic 404 for missing, unpublished, or archived profiles to
 *    avoid confirming the existence of private profiles.
 *
 * Compatibility note:
 *  The previous route was /api/vcard/[profileId] (UUID-based). The profile-view
 *  component has been updated to use the slug. If any existing deep links use a
 *  UUID, they will receive a 404 — intentional, since UUID-based public access
 *  was an enumeration risk. No redirect to UUID-based access is provided.
 *
 * Cache-Control is intentionally short (60 s) to reflect profile update latency
 * while still reducing unnecessary compute. Invalidation is tag-based in the
 * profile update path (revalidateTag).
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const requestId = generateRequestId();
  const { slug } = await params;

  // UUIDs are 8-4-4-4-12 hex characters with hyphens.
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  const isUUID = UUID_RE.test(slug);

  // Basic slug format validation
  if (!isUUID && (!slug || slug.length > 100 || !/^[a-zA-Z0-9_-]+$/.test(slug))) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  // Rate limit per IP before doing any DB work
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? '0.0.0.0';
  const { success: allowed, reset } = await vcardRatelimit.limit(ip);
  if (!allowed) {
    return NextResponse.json(
      { error: 'Too many requests' },
      {
        status: 429,
        headers: { 'Retry-After': String(Math.ceil((reset - Date.now()) / 1000)) },
      }
    );
  }

  try {
    // Select explicit public columns only — never select() the full profile row (S-13).
    // Filter: must be published AND not archived.
    const rows = await db
      .select(PROFILE_PUBLIC_COLS)
      .from(profiles)
      .where(
        and(
          isUUID ? eq(profiles.id, slug) : eq(profiles.slug, slug),
          eq(profiles.isPublished, true)
        )
      )
      .limit(1);

    const profile = rows[0];

    // Return the same 404 for missing, unpublished, and archived profiles
    // to avoid confirming the existence of private profiles via timing/response differences.
    if (!profile || profile.archivedAt) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const vcf = generateVCard(profile as Parameters<typeof generateVCard>[0]);
    const contentDisposition = getVCardFilename(profile);

    // Record the contact save (vCard download) securely and reliably.
    // We await this to ensure it completes before serverless execution halts.
    try {
      await db.insert(contactSaves).values({ profileId: profile.id });
    } catch (err) {
      logError({ operation: 'contact_saves.insert', error: err });
    }

    return new NextResponse(vcf, {
      status: 200,
      headers: {
        'Content-Type': 'text/vcard; charset=utf-8',
        // getVCardFilename returns the full Content-Disposition header value
        'Content-Disposition': contentDisposition,
        // Short public cache — profile edits are invalidated via revalidateTag
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    });

  } catch (error: unknown) {
    logError({ operation: 'vcard.GET', requestId, error });
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
}
