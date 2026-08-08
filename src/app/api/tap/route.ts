import { type NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { tapEvents, cards } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { extractTapData } from '@/lib/analytics';
import { tapRatelimit } from '@/lib/ratelimit';
import { z } from 'zod';

const UID_PATTERN = /^[A-Z0-9]{8,64}$/;

const schema = z.object({
  uid: z.string().min(8).max(64),
  type: z.enum(['tap', 'unclaimed']),
});

/**
 * POST /api/tap
 * Logs a tap event. Called client-side (fire-and-forget) from the profile page.
 * Non-blocking: the UI never waits for this response.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { uid, type } = schema.parse(body);
    
    // Explicitly validate format rather than silently replacing invalid chars
    const sanitizedUid = uid.toUpperCase();
    if (!UID_PATTERN.test(sanitizedUid)) {
      return NextResponse.json({ ok: false, reason: 'invalid_uid_format' }, { status: 400 });
    }

    // Rate limit by IP to prevent analytics spam
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? '0.0.0.0';
    const { success: allowed } = await tapRatelimit.limit(ip);
    if (!allowed) {
      return NextResponse.json({ ok: false, reason: 'rate_limited' }, { status: 429 });
    }

    // Look up the card
    const cardRows = await db
      .select()
      .from(cards)
      .where(eq(cards.cardUid, sanitizedUid))
      .limit(1);

    const card = cardRows[0];
    if (!card || !card.profileId) {
      // Card doesn't exist or not linked yet — still log for unclaimed analytics
      if (type === 'unclaimed') {
        // We can't log a proper tap event without a card ID, so just return OK
        return NextResponse.json({ ok: true, status: 'unclaimed_no_record' });
      }
      return NextResponse.json({ ok: false, reason: 'card_not_found' }, { status: 404 });
    }

    if (card.status !== 'active') {
      return NextResponse.json({ ok: false, reason: 'card_inactive' }, { status: 403 });
    }

    // Extract analytics data from the request
    const tapData = extractTapData(request, card.id, card.profileId);

    // Insert tap event
    await db.insert(tapEvents).values({
      cardId: card.id,
      profileId: card.profileId,
      ipHash: tapData.ipHash,
      country: tapData.country,
      city: tapData.city,
      deviceType: tapData.deviceType,
      os: tapData.os,
      browser: tapData.browser,
      referrer: tapData.referrer,
      sessionId: tapData.sessionId,
      isUnique: tapData.isUnique,
    });

    // Set session cookie on the response (so next tap from same browser is not unique)
    const response = NextResponse.json({ ok: true });
    if (tapData.isUnique) {
      response.cookies.set('_tap_sid', crypto.randomUUID(), {
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 60 * 60 * 24, // 24 hours
        path: '/',
      });
    }

    return response;
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ ok: false, reason: 'invalid_input' }, { status: 400 });
    }
    console.error('[tap] Error logging tap:', err);
    // Never return 500 to the client — we don't want to break the profile page
    return NextResponse.json({ ok: false, reason: 'internal' }, { status: 200 });
  }
}
