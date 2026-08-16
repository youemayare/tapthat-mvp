import { NextResponse } from 'next/server';
import { withRlsUser } from '@/lib/db/auth-wrapper';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { createClient } from '@/lib/supabase/server';
import { mutationRatelimit } from '@/lib/ratelimit';
import { logError, generateRequestId } from '@/lib/security';

export async function POST(req: Request) {
  const requestId = generateRequestId();

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Per-user rate limit (keyed by user ID — not IP — to avoid NAT false positives)
    const { success: allowed, reset } = await mutationRatelimit.limit(user.id);
    if (!allowed) {
      return NextResponse.json(
        { error: 'Too many requests' },
        {
          status: 429,
          headers: { 'Retry-After': String(Math.ceil((reset - Date.now()) / 1000)) },
        }
      );
    }

    const { fullName } = await req.json();

    if (typeof fullName !== 'string' || fullName.trim().length === 0) {
      return NextResponse.json({ error: 'Invalid name' }, { status: 400 });
    }

    const trimmedName = fullName.trim().slice(0, 50);

    // Use withRlsUser so the update runs under the authenticated user's RLS context,
    // consistent with every other authenticated route (fixes S-4).
    await withRlsUser(user, async (tx) => {
      await tx
        .update(users)
        .set({ fullName: trimmedName, updatedAt: new Date() })
        .where(eq(users.id, user.id));
    });

    // Keep Supabase auth metadata in sync
    await supabase.auth.updateUser({ data: { full_name: trimmedName } });

    return NextResponse.json({ success: true, fullName: trimmedName });

  } catch (error: unknown) {
    logError({ operation: 'user.POST', requestId, error });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
