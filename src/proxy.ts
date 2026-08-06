import { type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

export async function proxy(request: NextRequest) {
  // Always update Supabase Auth session
  return await updateSession(request);
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|api|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
