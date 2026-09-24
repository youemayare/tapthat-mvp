import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { waitlistEntries } from '@/lib/db/schema';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { waitlistJoinRatelimit } from '@/lib/ratelimit';
import { verifyTurnstileToken } from '@/lib/security';

const joinSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  email: z.string().email('Invalid email address'),
  profession: z.string().min(1, 'Profession is required'),
  whatsappNumber: z.string().optional(),
  whatsappMarketingConsent: z.boolean().default(false),
  turnstileToken: z.string().min(1, 'Verification required'),
  source: z.string().optional(),
  utmSource: z.string().optional(),
  utmMedium: z.string().optional(),
  utmCampaign: z.string().optional(),
  referredByCode: z.string().optional(),
});

function generateReferralCode() {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
}

export async function POST(req: Request) {
  try {
    const ip = req.headers.get('x-forwarded-for') ?? '127.0.0.1';
    const { success: ipSuccess } = await waitlistJoinRatelimit.limit(ip);
    if (!ipSuccess) {
      return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
    }

    const body = await req.json();
    const validatedData = joinSchema.parse(body);

    const isValidToken = await verifyTurnstileToken(validatedData.turnstileToken);
    if (!isValidToken) {
      return NextResponse.json({ error: 'Invalid captcha verification' }, { status: 400 });
    }

    // Check if email already exists
    const existingEntry = await db.query.waitlistEntries.findFirst({
      where: eq(waitlistEntries.email, validatedData.email.toLowerCase()),
    });

    if (existingEntry) {
      return NextResponse.json({ 
        success: true, 
        alreadyExists: true,
        waitlistId: existingEntry.id 
      });
    }

    const newEntry = await db.insert(waitlistEntries).values({
      firstName: validatedData.firstName,
      email: validatedData.email.toLowerCase(),
      profession: validatedData.profession,
      whatsappNumber: validatedData.whatsappNumber,
      whatsappMarketingConsent: validatedData.whatsappMarketingConsent,
      referralCode: generateReferralCode(),
      referredByCode: validatedData.referredByCode,
      source: validatedData.source,
      utmSource: validatedData.utmSource,
      utmMedium: validatedData.utmMedium,
      utmCampaign: validatedData.utmCampaign,
    }).returning({ id: waitlistEntries.id });

    return NextResponse.json({ 
      success: true, 
      waitlistId: newEntry[0].id 
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    console.error('Waitlist join error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
