import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { profiles } from '@/lib/db/schema';
import { and, eq } from 'drizzle-orm';
import { createClient } from '@/lib/supabase/server';
import { isMultiProfileEnabled } from '@/lib/feature-flags';
import { z } from 'zod';


const profileSchema = z.object({
  profilePhotoUrl: z.string().optional().nullable(),
  companyLogoUrl: z.string().optional().nullable(),
  cvUrl: z.string().optional().nullable(),
  firstName: z.string().max(50).optional().nullable(),
  lastName: z.string().max(50).optional().nullable(),
  slug: z.string().max(50).optional().nullable(),
  jobTitle: z.string().max(100).optional().nullable(),
  companyName: z.string().max(100).optional().nullable(),
  bio: z.string().max(500).optional().nullable(),
  phone: z.string().max(50).optional().nullable(),
  whatsapp: z.string().max(50).optional().nullable(),
  email: z.string().email().optional().nullable().or(z.literal('')),
  websiteUrl: z.string().url().optional().nullable().or(z.literal('')),
  linkedinUrl: z.string().url().optional().nullable().or(z.literal('')),
  instagramUrl: z.string().url().optional().nullable().or(z.literal('')),
  isPublished: z.boolean().default(false)
});

export async function PUT(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    
    // Convert empty strings to null for optional url/email fields
    const cleanBody = Object.fromEntries(
      Object.entries(body).map(([key, value]) => [key, value === '' ? null : value])
    );

    const parsed = profileSchema.parse(cleanBody);

    // Ensure the user exists in the public.users table to satisfy foreign key constraint
    // (In case the Supabase auth trigger wasn't set up properly)
    const { users } = await import('@/lib/db/schema');
    const existingUser = await db.select({ id: users.id }).from(users).where(eq(users.id, user.id)).limit(1);
    
    if (existingUser.length === 0) {
      await db.insert(users).values({
        id: user.id,
        email: user.email || 'unknown@tapthat.com',
        fullName: user.user_metadata?.full_name || null,
      });
    }

    // Check if profile exists
    const existing = await db.select({ id: profiles.id }).from(profiles).where(eq(profiles.userId, user.id)).limit(1);

    // ── Multi-profile: edit a specific profile by ID ──────────────────────────
    // Only triggered when the flag is on AND a profileId is explicitly provided.
    // Existing single-profile code path (no profileId) is completely unchanged.
    if (isMultiProfileEnabled() && body.profileId) {
      const targetProfile = await db.query.profiles.findFirst({
        where: and(eq(profiles.id, body.profileId), eq(profiles.userId, user.id)),
      });

      if (!targetProfile) {
        return NextResponse.json({ error: 'Profile not found or does not belong to you' }, { status: 404 });
      }

      const updated = await db
        .update(profiles)
        .set({ ...parsed, updatedAt: new Date() })
        .where(and(eq(profiles.id, body.profileId), eq(profiles.userId, user.id)))
        .returning();

      revalidatePath('/dashboard/profile');
      return NextResponse.json(updated[0]);
    }

    // ── Single-profile mode (unchanged from production) ───────────────────────
      if (existing.length > 0) {
      // Update
      const updated = await db.update(profiles)
        .set({
          ...parsed,
          updatedAt: new Date()
        })
        .where(eq(profiles.userId, user.id))
        .returning();
      
      revalidatePath('/dashboard/profile');
      return NextResponse.json(updated[0]);
    } else {
      // Insert
      const inserted = await db.insert(profiles)
        .values({
          userId: user.id,
          ...parsed
        })
        .returning();
      
      revalidatePath('/dashboard/profile');
      return NextResponse.json(inserted[0]);
    }


  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation Error', details: error.format() }, { status: 400 });
    }
    // Handle Postgres unique constraint error for slug (code 23505)
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === '23505') {
       return NextResponse.json({ error: 'Username/Slug is already taken' }, { status: 409 });
    }
    console.error('Profile update error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
