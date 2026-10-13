import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';
import { publicProfileRatelimit, authRouteRatelimit, uploadRatelimit } from '@/lib/ratelimit';

export async function proxy(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 
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

    // 2. Protect auth and admin login endpoints
    if (
      pathname.startsWith('/auth') ||
      pathname.startsWith('/api/auth') ||
      pathname.startsWith('/admin/login') ||
      pathname === '/login' ||
      pathname === '/signup'
    ) {
      const { success } = await authRouteRatelimit.limit(`${ip}:${pathname}`);
      if (!success) {
        return new NextResponse('Too Many Requests', { status: 429 });
      }
    }

    // 3. Protect public and audio upload API routes
    if (pathname.startsWith('/api/upload') || pathname.startsWith('/api/audio/upload')) {
      const { success } = await uploadRatelimit.limit(ip);
      if (!success) {
        return new NextResponse('Too Many Requests', { status: 429 });
      }
    }
  } catch (error) {
    // If Redis fails, fail open on public reads, but log error
    console.error('Proxy rate limit error:', error);
  }

  // Always update Supabase Auth session & handle route protection
  return await updateSession(request);
}

export const config = {
  matcher: [
    // Match all application pages and API routes; exclude only static build assets and public files
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|mp4|webm|pdf|vcf)$).*)',
  ],
};
