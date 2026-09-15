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

    const { fullName, handle } = await req.json();

    if (typeof fullName !== 'string' || fullName.trim().length === 0) {
      return NextResponse.json({ error: 'Invalid name' }, { status: 400 });
    }

    const trimmedName = fullName.trim().slice(0, 50);
    
    let trimmedHandle = undefined;
    if (handle !== undefined) {
      if (typeof handle !== 'string' || !/^[a-zA-Z0-9-]{3,30}$/.test(handle)) {
        return NextResponse.json({ error: 'Handle must be 3-30 letters, numbers, or hyphens' }, { status: 400 });
      }
      trimmedHandle = handle.toLowerCase();
    }

    // Use withRlsUser so the update runs under the authenticated user's RLS context,
    // consistent with every other authenticated route (fixes S-4).
    await withRlsUser(user, async (tx) => {
      if (trimmedHandle) {
        // Check uniqueness before updating
        const existing = await tx.query.users.findFirst({
          where: eq(users.handle, trimmedHandle)
        });
        if (existing && existing.id !== user.id) {
          throw new Error('HANDLE_TAKEN');
        }
      }

      await tx
        .update(users)
        .set({ 
          fullName: trimmedName, 
          ...(trimmedHandle !== undefined ? { handle: trimmedHandle } : {}),
          updatedAt: new Date() 
        })
        .where(eq(users.id, user.id));
    });

    // Keep Supabase auth metadata in sync
    await supabase.auth.updateUser({ data: { full_name: trimmedName } });

    return NextResponse.json({ success: true, fullName: trimmedName, handle: trimmedHandle });

  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'HANDLE_TAKEN') {
      return NextResponse.json({ error: 'Handle is already taken' }, { status: 409 });
    }
    logError({ operation: 'user.POST', requestId, error });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
