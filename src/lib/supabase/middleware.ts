import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

/**
 * Combined middleware:
 *  1. Refreshes Supabase auth session (keeps JWT alive)
 *  2. Protects /dashboard/* routes — redirects to /login if unauthenticated
 *  3. /n/[uid] tap logging is handled inside the route itself via waitUntil
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: do not add logic between createServerClient and supabase.auth.getUser()
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // ── Protect dashboard & claim routes ────────────────────────────
  if ((pathname.startsWith('/dashboard') || pathname.startsWith('/claim')) && !user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/login';
    // Preserve the original URL including search parameters (like ?uid=...)
    const fullOriginalUrl = `${pathname}${request.nextUrl.search}`;
    loginUrl.searchParams.set('redirectTo', fullOriginalUrl);
    return NextResponse.redirect(loginUrl);
  }

  // ── Redirect logged-in users away from auth pages ───────────────
  if ((pathname === '/login' || pathname === '/signup') && user) {
    const dashboardUrl = request.nextUrl.clone();
    dashboardUrl.pathname = '/dashboard';
    return NextResponse.redirect(dashboardUrl);
  }

  return supabaseResponse;
}
