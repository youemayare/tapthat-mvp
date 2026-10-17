/**
 * GET /api/og/profile/[profileId]
 *
 * Public OpenGraph / WhatsApp / social link preview thumbnail endpoint.
 *
 * Why this exists:
 *  - WhatsApp's link preview crawler strictly rejects `og:image` files larger than ~300 KB
 *    and requires fast, deterministic JPEG/PNG responses with explicit `Content-Length`.
 *  - Full-resolution profile avatars stored in R2 can exceed 1 MB (1200x1200 PNG),
 *    causing WhatsApp to display the title/description while silently dropping the thumbnail.
 *  - This endpoint fetches the profile's photo (or company logo), flattens any alpha channel,
 *    and re-encodes it as a crisp 600x600 progressive JPEG (~35–60 KB) cached at the Vercel Edge.
 */
import { NextResponse } from 'next/server';
import sharp from 'sharp';
import { db } from '@/lib/db';
import { profiles } from '@/lib/db/schema';
import { and, eq, isNull } from 'drizzle-orm';

const OG_SIZE = 600;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

async function fetchSourceBuffer(url: string): Promise<Buffer | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(7000) });
    if (!res.ok) return null;
    return Buffer.from(await res.arrayBuffer());
  } catch {
    return null;
  }
}

async function createFallbackOgJpeg(): Promise<Buffer> {
  const svg = Buffer.from(
    `<svg width="${OG_SIZE}" height="${OG_SIZE}" viewBox="0 0 ${OG_SIZE} ${OG_SIZE}" xmlns="http://www.w3.org/2000/svg">` +
      `<rect width="${OG_SIZE}" height="${OG_SIZE}" fill="#0f0f19"/>` +
      `<text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" fill="#ffffff" font-family="sans-serif" font-weight="bold" font-size="140">tayz</text>` +
      `</svg>`
  );
  return sharp(svg).jpeg({ quality: 82, progressive: true }).toBuffer();
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ profileId: string }> }
) {
  const { profileId: rawParam } = await params;
  const profileId = rawParam?.replace(/\.(jpe?g|png|webp)$/i, '') ?? '';

  if (!profileId || !UUID_RE.test(profileId)) {
    return new NextResponse('Not found', { status: 404 });
  }

  try {
    const profile = await db.query.profiles.findFirst({
      where: and(
        eq(profiles.id, profileId),
        eq(profiles.isPublished, true),
        isNull(profiles.archivedAt)
      ),
      columns: {
        profilePhotoUrl: true,
        companyLogoUrl: true,
      },
    });

    if (!profile) {
      return new NextResponse('Not found', { status: 404 });
    }

    const sourceUrl = profile.profilePhotoUrl || profile.companyLogoUrl;
    let jpegBuffer: Buffer | null = null;

    if (sourceUrl && sourceUrl.startsWith('https://')) {
      const raw = await fetchSourceBuffer(sourceUrl);
      if (raw) {
        jpegBuffer = await sharp(raw)
          .rotate()
          .resize(OG_SIZE, OG_SIZE, { fit: 'cover', position: 'centre' })
          .flatten({ background: '#0f0f19' })
          .jpeg({ quality: 82, progressive: true, mozjpeg: true })
          .toBuffer();
      }
    }

    if (!jpegBuffer) {
      jpegBuffer = await createFallbackOgJpeg();
    }

    return new NextResponse(new Uint8Array(jpegBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'image/jpeg',
        'Content-Length': String(jpegBuffer.byteLength),
        'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (err) {
    console.error('[OG Profile Image]', err);
    return new NextResponse('Error generating image', { status: 500 });
  }
}
