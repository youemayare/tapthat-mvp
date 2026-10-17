/**
 * GET /api/wallet/logo/[profileId]
 *
 * Public endpoint — Google Wallet fetches this to display the pass logo / circular profile photo.
 * Converts any profile photo or company logo (including .webp uploads) into a 256x256 PNG
 * because Google Wallet rejects .webp image URLs.
 */
import { NextResponse } from 'next/server';
import sharp from 'sharp';
import { db } from '@/lib/db';
import { profiles } from '@/lib/db/schema';
import { and, eq, isNull } from 'drizzle-orm';

const SIZE = 256;
const CACHE_SECONDS = 3600;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

async function fetchImageBuffer(url: string): Promise<Buffer | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
    if (!res.ok) return null;
    return Buffer.from(await res.arrayBuffer());
  } catch {
    return null;
  }
}

async function createFallbackLogoPng(): Promise<Buffer> {
  const svg = Buffer.from(
    `<svg width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}" xmlns="http://www.w3.org/2000/svg">` +
      `<rect width="${SIZE}" height="${SIZE}" fill="#0f0f19"/>` +
      `<text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" fill="#ffffff" font-family="sans-serif" font-weight="bold" font-size="72">tayz</text>` +
      `</svg>`
  );
  return sharp(svg).png().toBuffer();
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ profileId: string }> }
) {
  const { profileId } = await params;
  if (!profileId || !UUID_RE.test(profileId)) {
    return new NextResponse('Not found', { status: 404 });
  }

  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? '0.0.0.0';
    const { publicProfileRatelimit } = await import('@/lib/ratelimit');
    const { success: allowed } = await publicProfileRatelimit.limit(ip);
    if (!allowed) {
      return new NextResponse('Too many requests', { status: 429 });
    }

    const profile = await db.query.profiles.findFirst({
      where: and(eq(profiles.id, profileId), isNull(profiles.archivedAt)),
      columns: { profilePhotoUrl: true, companyLogoUrl: true },
    });

    if (!profile) {
      return new NextResponse('Not found', { status: 404 });
    }

    const sourceUrl = profile.profilePhotoUrl || profile.companyLogoUrl;
    let pngBuffer: Buffer | null = null;

    if (sourceUrl && sourceUrl.startsWith('https://')) {
      const raw = await fetchImageBuffer(sourceUrl);
      if (raw) {
        pngBuffer = await sharp(raw)
          .resize(SIZE, SIZE, { fit: 'cover', position: 'centre' })
          .png()
          .toBuffer();
      }
    }

    if (!pngBuffer) {
      pngBuffer = await createFallbackLogoPng();
    }

    return new NextResponse(new Uint8Array(pngBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': `public, max-age=${CACHE_SECONDS}, s-maxage=${CACHE_SECONDS}`,
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (err) {
    console.error('[Wallet Logo Image]', err);
    return new NextResponse('Error generating image', { status: 500 });
  }
}
