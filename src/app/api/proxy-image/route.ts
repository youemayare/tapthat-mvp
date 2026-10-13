import { NextResponse } from 'next/server';
import { uploadRatelimit } from '@/lib/ratelimit';

function isAllowedHostname(hostname: string): boolean {
  const lower = hostname.toLowerCase();

  // Explicitly deny private / local / metadata hosts (SSRF prevention)
  if (
    lower === 'localhost' ||
    lower === '127.0.0.1' ||
    lower === '0.0.0.0' ||
    lower === '::1' ||
    lower.startsWith('10.') ||
    lower.startsWith('192.168.') ||
    lower.startsWith('172.16.') ||
    lower.startsWith('169.254.')
  ) {
    return false;
  }

  // Allowed CDN / OAuth / Storage domains
  if (lower === 'lh3.googleusercontent.com') return true;
  if (lower.endsWith('.r2.dev')) return true;
  if (lower.endsWith('.supabase.co')) return true;

  // Custom configured domains
  if (process.env.NEXT_PUBLIC_R2_PUBLIC_URL) {
    try {
      const r2Host = new URL(process.env.NEXT_PUBLIC_R2_PUBLIC_URL).hostname.toLowerCase();
      if (lower === r2Host) return true;
    } catch {}
  }

  if (process.env.NEXT_PUBLIC_APP_URL) {
    try {
      const appHost = new URL(process.env.NEXT_PUBLIC_APP_URL).hostname.toLowerCase();
      if (lower === appHost) return true;
    } catch {}
  }

  return false;
}

export async function GET(req: Request) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? '127.0.0.1';
  const { success: allowed } = await uploadRatelimit.limit(`proxy-img:${ip}`);
  if (!allowed) {
    return new NextResponse('Too Many Requests', { status: 429 });
  }

  const { searchParams } = new URL(req.url);
  const rawUrl = searchParams.get('url');

  if (!rawUrl) {
    return new NextResponse('Missing URL parameter', { status: 400 });
  }

  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return new NextResponse('Invalid URL', { status: 400 });
  }

  // Enforce HTTPS only (blocks file:, http:, gopher:, etc.)
  if (parsed.protocol !== 'https:') {
    return new NextResponse('HTTPS protocol required', { status: 400 });
  }

  if (!isAllowedHostname(parsed.hostname)) {
    return new NextResponse('Forbidden upstream host', { status: 403 });
  }

  try {
    const res = await fetch(parsed.toString(), {
      redirect: 'error', // Prevent SSRF via open redirect chains
    });

    if (!res.ok) {
      return new NextResponse('Failed to fetch image', { status: 502 });
    }

    const contentType = res.headers.get('content-type') || '';
    if (!contentType.toLowerCase().startsWith('image/')) {
      return new NextResponse('Upstream resource is not an image', { status: 415 });
    }

    // Guard against oversized payloads (max 10MB)
    const contentLength = res.headers.get('content-length');
    if (contentLength && parseInt(contentLength, 10) > 10 * 1024 * 1024) {
      return new NextResponse('Image exceeds maximum allowed size (10MB)', { status: 413 });
    }

    const blob = await res.blob();
    return new NextResponse(blob, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400, s-maxage=86400',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (e) {
    console.error('[proxy-image] Safe fetch failed:', e);
    return new NextResponse('Failed to proxy image', { status: 500 });
  }
}
