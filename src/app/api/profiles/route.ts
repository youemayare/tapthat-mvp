/**
 * GET  /api/profiles        — list all profiles for the authenticated user
 * POST /api/profiles        — create a new profile
 *
 * Both endpoints require MULTI_PROFILE_ENABLED=true.
 * When the flag is false, the existing PUT /api/profile endpoint handles
 * single-profile editing and these routes return 403.
 */
import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

import { withRlsUser } from '@/lib/db/auth-wrapper';
import { profiles, users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { createClient } from '@/lib/supabase/server';
import { isMultiProfileEnabled } from '@/lib/feature-flags';
import { z } from 'zod';

const createProfileSchema = z.object({
  label: z.string().min(1).max(50),
  // slug is optional at creation; user can set it later
  slug: z.string().max(50).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens').optional().nullable(),
});

export async function GET() {
  if (!isMultiProfileEnabled()) {
    return NextResponse.json({ error: 'Feature not enabled' }, { status: 403 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  return await withRlsUser(user, async (tx) => {
    const userProfiles = await tx
      .select({
        id: profiles.id,
        label: profiles.label,
        slug: profiles.slug,
        firstName: profiles.firstName,
        lastName: profiles.lastName,
        jobTitle: profiles.jobTitle,
        isPublished: profiles.isPublished,
        isDefault: profiles.isDefault,
        archivedAt: profiles.archivedAt,
        createdAt: profiles.createdAt,
      })
      .from(profiles)
      .where(eq(profiles.userId, user.id))
      .orderBy(profiles.createdAt);

    return NextResponse.json({ profiles: userProfiles });
  });
}

export async function POST(req: Request) {
  if (!isMultiProfileEnabled()) {
    return NextResponse.json({ error: 'Feature not enabled' }, { status: 403 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  return await withRlsUser(user, async (tx) => {
    try {
      const body = await req.json();
      const parsed = createProfileSchema.parse(body);

      // Self-heal: ensure user exists in public.users
      await tx.insert(users).values({
        id: user.id,
        email: user.email || '',
        fullName: user.user_metadata?.full_name ?? null,
      }).onConflictDoNothing();

      const [newProfile] = await tx
        .insert(profiles)
        .values({
          userId: user.id,
          label: parsed.label,
          slug: parsed.slug ?? null,
          isPublished: false,
          isDefault: false,
        })
        .returning();

      revalidatePath('/dashboard/profile');
      return NextResponse.json({ profile: newProfile }, { status: 201 });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return NextResponse.json({ error: 'Validation error', details: err.format() }, { status: 400 });
      }
      // Slug unique constraint
      const e = err as { code?: string };
      if (e?.code === '23505') {
        return NextResponse.json({ error: 'That slug is already taken' }, { status: 409 });
      }
      console.error('[POST /api/profiles]', err);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  });
}
