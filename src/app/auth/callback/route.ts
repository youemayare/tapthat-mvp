import { type NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Supabase Auth callback handler.
 * Called after email confirmation links or OAuth redirects.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
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
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (!exchangeError) {
      return NextResponse.redirect(`${origin}${redirectTo}`);
    }
  }

  return NextResponse.redirect(
    `${origin}/login?message=${encodeURIComponent('Could not sign in. Please try again.')}`
  );
}
