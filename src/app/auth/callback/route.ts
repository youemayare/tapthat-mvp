import { type NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { connections, cards, profiles, users } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

/**
 * Supabase Auth callback handler.
 * Called after email confirmation links or OAuth redirects.
 * If a `save` param is present (set during signup from a profile page),
 * automatically saves that profile as a connection after auth completes.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  // UID of the card the user was viewing when they chose to sign up
  const saveUid = searchParams.get('save');
  let redirectTo = searchParams.get('redirectTo') ?? '/dashboard';

  // Prevent open redirect vulnerabilities
  if (!redirectTo.startsWith('/')) {
    redirectTo = '/dashboard';
  }
  const error = searchParams.get('error');

  if (error) {
    return NextResponse.redirect(
      `${origin}/login?message=${encodeURIComponent('Authentication failed. Please try again.')}`
    );
  }

  if (code) {
    const supabase = await createClient();
    
    let user = null;
    if (code === 'email-login-save') {
      // The client already logged in and set the cookie
      const { data, error: userError } = await supabase.auth.getUser();
      // Explicit null check — getUser() can return null without an error
      user = (!userError && data.user) ? data.user : null;
    } else {
      // Standard OAuth / Magic Link flow
      const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
      user = exchangeError ? null : data.user;
    }

    if (user) {
      // Self-healing: ensure user exists in public.users
      try {
        await db.insert(users).values({
          id: user.id,
          email: user.email!,
          fullName: user.user_metadata?.full_name ?? null,
          avatarUrl: user.user_metadata?.avatar_url ?? null,
        }).onConflictDoNothing();
      } catch { /* non-critical */ }

      // ── Post-signup auto-connect ──
      if (saveUid) {
        const sanitizedUid = saveUid.toUpperCase();
        if (/^[A-Z0-9]{8,64}$/.test(sanitizedUid)) {
          try {
            // Find the profile linked to this card
            const result = await db
              .select({ card: cards, profile: profiles })
              .from(cards)
              .leftJoin(profiles, eq(cards.profileId, profiles.id))
              .where(and(eq(cards.cardUid, sanitizedUid), eq(cards.status, 'active')))
              .limit(1);

            const profile = result[0]?.profile;
            // Only save if profile exists, is published, and isn't the user's own
            if (profile && profile.isPublished && profile.userId !== user.id) {
              await db.insert(connections).values({
                viewerUserId: user.id,
                profileId: profile.id,
              }).onConflictDoNothing();

              // Redirect back to the profile they just saved
              return NextResponse.redirect(`${origin}/n/${sanitizedUid}?saved=1`);
            }
          } catch { /* non-critical — fall through to dashboard */ }
        }
      }

      return NextResponse.redirect(`${origin}${redirectTo}`);
    }
  }

  return NextResponse.redirect(
    `${origin}/login?message=${encodeURIComponent('Could not sign in. Please try again.')}`
  );
}
