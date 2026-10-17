import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { contactExchanges, profiles } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import crypto from 'crypto';
import { exchangeIpRatelimit } from '@/lib/ratelimit';
import { verifyTurnstileToken } from '@/lib/security';

const anonymousExchangeSchema = z.object({
  targetProfileId: z.string().uuid(),
  sourceChannel: z.enum(['nfc', 'qr', 'direct_link']).default('direct_link'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  companyName: z.string().optional(),
  jobTitle: z.string().optional(),
  notes: z.string().optional(),
  turnstileToken: z.string().min(1, 'Verification required'),
  consentGiven: z.boolean().refine(val => val === true, {
    message: "You must consent to sharing your details",
  }),
});

export async function POST(req: Request) {
  try {
    // 1. IP Rate Limiting (Anonymous is higher risk)
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? '127.0.0.1';
    const { success: ipSuccess } = await exchangeIpRatelimit.limit(ip);
    if (!ipSuccess) {
      return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
    }

    const body = await req.json();
    
    // 2. Validate body
    const validatedData = anonymousExchangeSchema.parse(body);

    if (!validatedData.email && !validatedData.phone) {
      return NextResponse.json({ error: 'Either email or phone is required' }, { status: 400 });
    }

    // 3. Verify Turnstile (with hostname, action, and client IP binding)
    const isValidToken = await verifyTurnstileToken(validatedData.turnstileToken, {
      remoteIp: ip,
      expectedAction: 'anonymous_exchange',
      requestHost: req.headers.get('x-forwarded-host') || req.headers.get('host'),
    });
    if (!isValidToken) {
      return NextResponse.json({ error: 'Invalid captcha verification' }, { status: 400 });
    }

    // 4. Verify Target Profile exists
    const targetProfile = await db.query.profiles.findFirst({
      where: eq(profiles.id, validatedData.targetProfileId)
    });

    if (!targetProfile) {
      return NextResponse.json({ error: 'Target profile not found' }, { status: 404 });
    }

    // 5. Generate HMAC token for erasure
    const hmacSecret = process.env.HMAC_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!hmacSecret) {
      if (process.env.NODE_ENV === 'production') {
        console.error('CRITICAL: HMAC_SECRET_KEY is missing in production.');
        return NextResponse.json({ error: 'Server security configuration error' }, { status: 500 });
      }
    }
    const effectiveSecret = hmacSecret || 'dev-ephemeral-hmac-secret-change-in-env';

    const rawErasureToken = crypto.randomBytes(32).toString('hex');
    const erasureTokenHash = crypto
      .createHmac('sha256', effectiveSecret)
      .update(rawErasureToken)
      .digest('hex');

    // 6. Generate email/phone hashes for duplicate detection
    const emailHash = validatedData.email 
      ? crypto.createHmac('sha256', effectiveSecret).update(validatedData.email.toLowerCase()).digest('hex')
      : null;
    const phoneHash = validatedData.phone
      ? crypto.createHmac('sha256', effectiveSecret).update(validatedData.phone).digest('hex')
      : null;

    // 7. Insert Exchange
    const [exchange] = await db.insert(contactExchanges).values({
      recipientUserId: targetProfile.userId,
      recipientProfileId: targetProfile.id,
      sourceType: 'manual', // as per schema
      sourceChannel: validatedData.sourceChannel,
      status: 'pending',
      name: `${validatedData.firstName} ${validatedData.lastName || ''}`.trim(),
      email: validatedData.email || null,
      phone: validatedData.phone || null,
      company: validatedData.companyName || null,
      jobTitle: validatedData.jobTitle || null,
      message: validatedData.notes || null,
      emailHash,
      phoneHash,
      consentVersion: '1.0',
      consentedAt: new Date(),
      erasureTokenHash,
    }).returning();

    return NextResponse.json({ success: true, id: exchange.id, erasureToken: rawErasureToken });
    
  } catch (error) {
    console.error('[Anonymous Exchange Error]', error);
    if (error instanceof z.ZodError || (error && typeof error === 'object' && 'errors' in error)) {
      const issues = (error as any).errors || (error as any).issues;
      const message = Array.isArray(issues) && issues.length > 0 ? issues[0].message : 'Validation error';
      return NextResponse.json({ error: message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
