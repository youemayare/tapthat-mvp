import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';
import { publicProfileRatelimit, authRouteRatelimit, uploadRatelimit } from '@/lib/ratelimit';

export async function proxy(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') ?? 
             request.headers.get('x-real-ip') ?? 
             '127.0.0.1';
  
  const pathname = request.nextUrl.pathname;

  try {
    // 1. Protect public profile and tap routes
    if (pathname.startsWith('/p/') || pathname.startsWith('/n/')) {
      const { success } = await publicProfileRatelimit.limit(ip);
      if (!success) {
        return new NextResponse('Too Many Requests', { status: 429 });
      }
    }

    // 2. Protect auth endpoints (login, signup, callback)
    if (pathname.startsWith('/auth') || pathname.startsWith('/api/auth')) {
      const { success } = await authRouteRatelimit.limit(`${ip}:${pathname}`);
      if (!success) {
        return new NextResponse('Too Many Requests', { status: 429 });
      }
    }

    // 3. Protect public upload API route
    if (pathname.startsWith('/api/upload')) {
      const { success } = await uploadRatelimit.limit(ip);
      if (!success) {
        return new NextResponse('Too Many Requests', { status: 429 });
      }
    }
  } catch (error) {
    // If Redis fails, fail open to prevent taking the whole site down
    console.error('Rate limit error:', error);
  }

  // Always update Supabase Auth session
  return await updateSession(request);
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|api|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    '/api/auth/:path*',
    '/api/upload'
  ],
};
