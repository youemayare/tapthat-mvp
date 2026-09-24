import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { waitlistEntries } from '@/lib/db/schema';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { waitlistSurveyRatelimit } from '@/lib/ratelimit';

const surveySchema = z.object({
  preferredCardColor: z.string().optional(),
  preferredCardFinish: z.string().optional(),
  primaryUseCases: z.array(z.string()).optional(),
  priorityBenefits: z.array(z.string()).optional(),
  purchaseIntent: z.string().optional(),
  priceValuePerception: z.string().optional(),
  feedback: z.string().optional(),
  researchCallOptIn: z.boolean().default(false),
  preferredContactMethod: z.string().optional(),
  city: z.string().optional(),
  companyName: z.string().optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ip = req.headers.get('x-forwarded-for') ?? '127.0.0.1';
    const { success: ipSuccess } = await waitlistSurveyRatelimit.limit(ip);
    if (!ipSuccess) {
      return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
    }

    const { id: waitlistId } = await params;
    if (!waitlistId) {
      return NextResponse.json({ error: 'Missing ID' }, { status: 400 });
    }

    const body = await req.json();
    
    // Allow users to just skip
    if (body.skipped) {
      await db.update(waitlistEntries)
        .set({ waitlistStatus: 'survey_skipped', updatedAt: new Date() })
        .where(eq(waitlistEntries.id, waitlistId));
      return NextResponse.json({ success: true });
    }

    const validatedData = surveySchema.parse(body);

    const updated = await db.update(waitlistEntries)
      .set({
        ...validatedData,
        waitlistStatus: 'survey_completed',
        updatedAt: new Date(),
      })
      .where(eq(waitlistEntries.id, waitlistId))
      .returning({ id: waitlistEntries.id, referralCode: waitlistEntries.referralCode });

    if (!updated.length) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true,
      referralCode: updated[0].referralCode
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    console.error('Waitlist survey error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
