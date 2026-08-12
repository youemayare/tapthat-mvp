import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { publicProfileRatelimit, authRouteRatelimit, uploadRatelimit } from '@/lib/ratelimit';

export async function middleware(request: NextRequest) {
  // Attempt to get IP from standard headers, default to loopback if unavailable
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
    // Key by IP + pathname to separate limits per route
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
    // If Redis fails, fail open (allow the request) to prevent taking the whole site down
    console.error('Rate limit error:', error);
  }

  return NextResponse.next();
}

// Only run middleware on the specific routes we want to protect
export const config = {
  matcher: [
    '/p/:path*',
    '/n/:path*',
    '/auth/:path*',
    '/api/auth/:path*',
    '/api/upload',
  ],
};
