/**
 * GET /api/wallet/hero-image/[profileId]
 *
 * Public endpoint — Google Wallet fetches this to display the pass hero image.
 * Dynamically composites the user's wallet banner + circular profile photo
 * into a single 1032x812 PNG (matching the Anoya profile card visual style).
 *
 * Auth: none required (Google Wallet fetches without credentials).
 * Caching: Cache-Control header + versioned ?v= query param for cache busting.
 */
import { NextResponse } from 'next/server';
import sharp from 'sharp';
import { db } from '@/lib/db';
import { profiles } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

const W = 1032;
const H = 812;
const PFP_DIAMETER = 210;
const BORDER = 10;
const OUTER = PFP_DIAMETER + BORDER * 2;
const BRAND_BG = { r: 15, g: 15, b: 25, alpha: 1 as const };
const CACHE_SECONDS = 3600;

async function fetchImageBuffer(url: string): Promise<Buffer | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
    if (!res.ok) return null;
    return Buffer.from(await res.arrayBuffer());
  } catch {
    return null;
  }
}

async function buildComposite(bannerUrl: string | null, pfpUrl: string | null): Promise<Buffer> {
  // ── Banner / background ────────────────────────────────────────────────────
  let bannerLayer: Buffer;
  if (bannerUrl) {
    const raw = await fetchImageBuffer(bannerUrl);
    bannerLayer = raw
      ? await sharp(raw).resize(W, H, { fit: 'cover', position: 'centre' }).png().toBuffer()
      : await sharp({ create: { width: W, height: H, channels: 4, background: BRAND_BG } }).png().toBuffer();
  } else {
    bannerLayer = await sharp({ create: { width: W, height: H, channels: 4, background: BRAND_BG } }).png().toBuffer();
  }

  if (!pfpUrl) return bannerLayer;

  const pfpRaw = await fetchImageBuffer(pfpUrl);
  if (!pfpRaw) return bannerLayer;

  // ── Circular profile photo ─────────────────────────────────────────────────
  const pfpSquare = await sharp(pfpRaw)
    .resize(PFP_DIAMETER, PFP_DIAMETER, { fit: 'cover', position: 'centre' })
    .png()
    .toBuffer();

  const circleSvg = Buffer.from(
    `<svg viewBox="0 0 ${PFP_DIAMETER} ${PFP_DIAMETER}" xmlns="http://www.w3.org/2000/svg">` +
    `<circle cx="${PFP_DIAMETER / 2}" cy="${PFP_DIAMETER / 2}" r="${PFP_DIAMETER / 2}" fill="white"/></svg>`
  );

  const circularPfp = await sharp(pfpSquare)
    .composite([{ input: circleSvg, blend: 'dest-in' }])
    .png()
    .toBuffer();

  // White border ring
  const borderSvg = Buffer.from(
    `<svg viewBox="0 0 ${OUTER} ${OUTER}" xmlns="http://www.w3.org/2000/svg">` +
    `<circle cx="${OUTER / 2}" cy="${OUTER / 2}" r="${OUTER / 2}" fill="white"/></svg>`
  );

  const whiteDisk = await sharp({
    create: { width: OUTER, height: OUTER, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 1 } },
  })
    .composite([{ input: borderSvg, blend: 'dest-in' }])
    .png()
    .toBuffer();

  // ── Composite: PFP centred horizontally, sitting at ~72% down the banner ──
  const pfpLeft = Math.round((W - OUTER) / 2);
  const pfpTop = Math.round(H * 0.72 - OUTER / 2);

  return sharp(bannerLayer)
    .composite([
      { input: whiteDisk, left: pfpLeft, top: pfpTop },
      { input: circularPfp, left: pfpLeft + BORDER, top: pfpTop + BORDER },
    ])
    .png()
    .toBuffer();
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ profileId: string }> }
) {
  const { profileId } = await params;
  if (!profileId) return new NextResponse('Not found', { status: 404 });

  try {
    const profile = await db.query.profiles.findFirst({
      where: eq(profiles.id, profileId),
      columns: { walletHeroImageUrl: true, profilePhotoUrl: true },
    });

    if (!profile) return new NextResponse('Not found', { status: 404 });

    const composite = await buildComposite(
      profile.walletHeroImageUrl || null,
      profile.profilePhotoUrl || null
    );

    return new NextResponse(composite as any, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': `public, max-age=${CACHE_SECONDS}, s-maxage=${CACHE_SECONDS}`,
      },
    });
  } catch (err) {
    console.error('[Wallet Hero Image]', err);
    return new NextResponse('Error generating image', { status: 500 });
  }
}