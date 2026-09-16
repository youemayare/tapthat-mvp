import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { contactExchanges } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';
import { exchangeIpRatelimit } from '@/lib/ratelimit';

export async function POST(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const { id: exchangeId } = await props.params;

    // 1. IP Rate Limiting
    const ip = req.headers.get('x-forwarded-for') ?? '127.0.0.1';
    const { success } = await exchangeIpRatelimit.limit(ip);
    if (!success) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const { token } = await req.json();
    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    const exchange = await db.query.contactExchanges.findFirst({
      where: eq(contactExchanges.id, exchangeId)
    });

    if (!exchange || exchange.sourceType !== 'manual') {
      return NextResponse.json({ error: 'Exchange not found' }, { status: 404 });
    }

    if (exchange.status === 'withdrawn') {
      return NextResponse.json({ error: 'Exchange already withdrawn' }, { status: 400 });
    }

    // 2. Hash provided token and compare
    const providedHash = crypto
      .createHmac('sha256', process.env.HMAC_SECRET_KEY || 'default-secret')
      .update(token)
      .digest('hex');

    if (providedHash !== exchange.erasureTokenHash) {
      return NextResponse.json({ error: 'Invalid or unauthorized token' }, { status: 403 });
    }

    // 3. Mark as withdrawn (or hard delete)
    // We choose soft delete to keep audit of block evasion
    await db.update(contactExchanges)
      .set({ 
        status: 'withdrawn',
        // Optional: blank out PII
        name: null,
        email: null,
        phone: null,
        company: null,
        jobTitle: null,
        message: null,
      })
      .where(eq(contactExchanges.id, exchangeId));

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[Erasure Error]', err);
    return NextResponse.json({ error: err.message || 'Internal server error', stack: err.stack }, { status: 500 });
  }
}
