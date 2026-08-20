import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

import { withRlsUser } from '@/lib/db/auth-wrapper';
import { profiles } from '@/lib/db/schema';
import { and, eq } from 'drizzle-orm';
import { createClient } from '@/lib/supabase/server';
import { isMultiProfileEnabled } from '@/lib/feature-flags';
import { z } from 'zod';
import { mutationRatelimit } from '@/lib/ratelimit';
import { logError, generateRequestId } from '@/lib/security';


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
  isPublished: z.boolean().default(false),
  label: z.string().max(50).optional().nullable(),
  // Google Wallet Appearance
  walletThemeColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Must be a valid hex color (#RRGGBB)')
    .optional()
    .nullable()
    .or(z.literal('')),
  walletHeroImageUrl: z
    .string()
    .url('Must be a valid HTTPS URL')
    .startsWith('https://', 'Wallet image URL must be HTTPS')
    .optional()
    .nullable()
    .or(z.literal('')),
});

export async function PUT(req: Request) {
  const requestId = generateRequestId();
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Per-user rate limit (S-7)
    const { success: allowed, reset } = await mutationRatelimit.limit(user.id);
    if (!allowed) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil((reset - Date.now()) / 1000)) } }
      );
    }

    const body = await req.json();
    
    // Convert empty strings to null for optional url/email fields
    const cleanBody = Object.fromEntries(
      Object.entries(body).map(([key, value]) => [key, value === '' ? null : value])
    );

    const parsed = profileSchema.parse(cleanBody);
    const { users } = await import('@/lib/db/schema');

    const result = await withRlsUser(user, async (tx) => {
      // Ensure the user exists in the public.users table to satisfy foreign key constraint
      // (In case the Supabase auth trigger wasn't set up properly)
      const existingUser = await tx.select({ id: users.id }).from(users).where(eq(users.id, user.id)).limit(1);
      
      if (existingUser.length === 0) {
        await tx.insert(users).values({
          id: user.id,
          email: user.email || 'unknown@tapthat.com',
          fullName: user.user_metadata?.full_name || null,
        });
      }

      // Check if profile exists
      const existing = await tx.select({ id: profiles.id }).from(profiles).where(eq(profiles.userId, user.id)).limit(1);

      // ── Multi-profile: edit a specific profile by ID ──────────────────────────
      // Only triggered when the flag is on AND a profileId is explicitly provided.
      // Existing single-profile code path (no profileId) is completely unchanged.
      if (isMultiProfileEnabled() && body.profileId) {
        const targetProfile = await tx.query.profiles.findFirst({
          where: and(eq(profiles.id, body.profileId), eq(profiles.userId, user.id)),
        });

        if (!targetProfile) {
          throw new Error('Profile not found or does not belong to you');
        }

        const updated = await tx
          .update(profiles)
          .set({ ...parsed, updatedAt: new Date() })
          .where(and(eq(profiles.id, body.profileId), eq(profiles.userId, user.id)))
          .returning();

        return updated[0];
      }

      // ── Single-profile mode (legacy fallback) ─────────────────────────────────
      if (existing.length > 0) {
        // Update
        const updated = await tx.update(profiles)
          .set({
            ...parsed,
            updatedAt: new Date()
          })
          .where(eq(profiles.id, existing[0].id))
          .returning();
        
        return updated[0];
      } else {
        // Insert
        const inserted = await tx.insert(profiles)
          .values({
            userId: user.id,
            ...parsed
          })
          .returning();
        
        return inserted[0];
      }
    });

    // Invalidate the ISR cache for this profile so image/text changes show immediately.
    const { revalidateTag } = await import('next/cache');
    if (result) {
      // These tags must match the ones used in getCachedProfileBySlug / getCachedProfileByUid
      if (result.id) revalidateTag(`profile-${result.id}`, 'default');
      if (result.slug) revalidateTag(`profile-${result.slug}`, 'default');
    }

    // Revalidate the dashboard profile editor and both public profile routes
    revalidatePath('/dashboard/profile');
    revalidatePath(`/n/[uid]`, 'page');
    revalidatePath(`/p/[slug]`, 'page');

    // Non-blocking: update the Google Wallet pass object if it exists.
    // We fire and forget — a failure here must never break the profile save response.
    if (result) {
      const { patchGoogleWalletObject } = await import('@/lib/wallet/google');
      const fullName = [result.firstName, result.lastName].filter(Boolean).join(' ') || 'My Profile';
      patchGoogleWalletObject({
        id: result.id,
        name: fullName,
        jobTitle: result.jobTitle,
        company: result.companyName,
        slug: result.slug,
        profilePhotoUrl: result.profilePhotoUrl,
        companyLogoUrl: result.companyLogoUrl,
        walletThemeColor: result.walletThemeColor,
        walletHeroImageUrl: result.walletHeroImageUrl,
        phone: result.phone,
        email: result.email,
        websiteUrl: result.websiteUrl,
        linkedinUrl: result.linkedinUrl,
        whatsapp: result.whatsapp,
        updatedAt: result.updatedAt,
      }).catch((err) => console.error('[Profile API] Background wallet PATCH failed:', err));
    }

    return NextResponse.json(result);

  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation Error', details: error.format() }, { status: 400 });
    }
    // Handle Postgres unique constraint error for slug (code 23505)
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === '23505') {
       return NextResponse.json({ error: 'Username/Slug is already taken' }, { status: 409 });
    }
    if (error instanceof Error && error.message === 'Profile not found or does not belong to you') {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    logError({ operation: 'profile.PUT', requestId, error });
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  if (!isMultiProfileEnabled()) {
    return NextResponse.json({ error: 'Deletion is not enabled in single-profile mode' }, { status: 403 });
  }

  const requestId = generateRequestId();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Per-user rate limit (S-7)
  const { success: allowed, reset } = await mutationRatelimit.limit(user.id);
  if (!allowed) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil((reset - Date.now()) / 1000)) } }
    );
  }

  try {
    const { searchParams } = new URL(req.url);
    const profileId = searchParams.get('id');

    if (!profileId) {
      return NextResponse.json({ error: 'Profile ID is required' }, { status: 400 });
    }

    await withRlsUser(user, async (tx) => {
      // Check if the profile belongs to the user and if it's the default profile
      const existing = await tx
        .select({ id: profiles.id, isDefault: profiles.isDefault })
        .from(profiles)
        .where(and(eq(profiles.id, profileId), eq(profiles.userId, user.id)))
        .limit(1);

      if (existing.length === 0) {
        throw new Error('Profile not found');
      }

      if (existing[0].isDefault) {
        throw new Error('Cannot delete default profile');
      }

      // Perform hard delete, enforcing ownership in the query
      await tx.delete(profiles).where(and(eq(profiles.id, profileId), eq(profiles.userId, user.id)));
    });

    revalidatePath('/dashboard/profile');
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'Profile not found') return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    if (error instanceof Error && error.message === 'Cannot delete default profile') return NextResponse.json({ error: 'Cannot delete your default profile. Please set another profile as default first.' }, { status: 400 });
    logError({ operation: 'profile.DELETE', requestId, error });
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
