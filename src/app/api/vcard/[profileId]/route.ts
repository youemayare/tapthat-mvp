import { type NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { profiles } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { generateVCard, getVCardFilename } from '@/lib/vcard';

/**
 * GET /api/vcard/[profileId]
 * Returns a .vcf file for instant contact saving — no app required.
 * Cached at the edge for 60 seconds; revalidated when profile is updated.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ profileId: string }> }
) {
  const { profileId } = await params;

  const rows = await db
    .select()
    .from(profiles)
    .where(eq(profiles.id, profileId))
    .limit(1);

  const profile = rows[0];

  if (!profile || !profile.isPublished) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
  }

  const vcf = generateVCard(profile);
  const filename = getVCardFilename(profile);

  return new NextResponse(vcf, {
    status: 200,
    headers: {
      'Content-Type': 'text/vcard; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
    },
  });
}
