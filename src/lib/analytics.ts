import { type NextRequest } from 'next/server';
import { createHash } from 'crypto';

export interface TapEventData {
  cardId: string;
  profileId: string;
  ipHash: string;
  country: string | null;
  city: string | null;
  deviceType: 'mobile' | 'tablet' | 'desktop';
  os: string;
  browser: string;
  referrer: string | null;
  sessionId: string | null;
  isUnique: boolean;
}

/**
 * Extracts analytics data from a tap request.
 * Called from /n/[uid]/route or middleware.
 */
export function extractTapData(request: NextRequest, cardId: string, profileId: string): TapEventData {
  const ua = request.headers.get('user-agent') ?? '';
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    ?? request.headers.get('x-real-ip')
    ?? '0.0.0.0';

  // GDPR compliant: hash IP with date salt (resets daily)
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const ipHash = createHash('sha256').update(`${ip}:${today}`).digest('hex');

  // Vercel edge geolocation headers (trusted by platform)
  const rawCountryCode = request.headers.get('x-vercel-ip-country');
  const country = rawCountryCode ? normalizeCountry(rawCountryCode) : 'Unknown';
  const city = request.headers.get('x-vercel-ip-city') ?? 'Unknown';

  const { deviceType, os, browser } = parseUserAgent(ua);

  const referrer = request.headers.get('referer') ?? null;

  // Session: read from cookie (set on first tap, persists 24h)
  const sessionId = request.cookies.get('_tap_sid')?.value ?? null;
  const isUnique = !sessionId; // First visit if no cookie

  return { cardId, profileId, ipHash, country, city, deviceType, os, browser, referrer, sessionId, isUnique };
}

/** Lightweight UA parser — no external library, runs at edge */
export function parseUserAgent(ua: string): {
  deviceType: 'mobile' | 'tablet' | 'desktop';
  os: string;
  browser: string;
} {
  const u = ua.toLowerCase();

  // Device type
  let deviceType: 'mobile' | 'tablet' | 'desktop' = 'desktop';
  if (/tablet|ipad/i.test(ua)) {
    deviceType = 'tablet';
  } else if (/mobile|android|iphone|ipod|blackberry|windows phone/i.test(ua)) {
    deviceType = 'mobile';
  }

  // OS
  let os = 'Other';
  if (/iphone|ipad|ipod/.test(u)) os = 'iOS';
  else if (/android/.test(u)) os = 'Android';
  else if (/windows nt/.test(u)) os = 'Windows';
  else if (/mac os x/.test(u) && !/iphone|ipad/.test(u)) os = 'macOS';
  else if (/linux/.test(u)) os = 'Linux';

  // Browser
  let browser = 'Other';
  if (/edg\//.test(u)) browser = 'Edge';
  else if (/opr\/|opera/.test(u)) browser = 'Opera';
  else if (/chrome\//.test(u) && !/chromium/.test(u)) browser = 'Chrome';
  else if (/firefox\//.test(u)) browser = 'Firefox';
  else if (/safari\//.test(u) && !/chrome/.test(u)) browser = 'Safari';
  else if (/msie|trident/.test(u)) browser = 'IE';

  return { deviceType, os, browser };
}

/**
 * Date range helpers for analytics queries.
 */
export function getDateRange(period: '7d' | '30d' | '90d'): { from: Date; to: Date } {
  const to = new Date();
  const from = new Date();
  const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
  from.setDate(from.getDate() - days);
  from.setHours(0, 0, 0, 0);
  return { from, to };
}

/**
 * Normalizes ISO country codes to readable names for the dashboard.
 */
function normalizeCountry(code: string): string {
  const names: Record<string, string> = {
    'AE': 'United Arab Emirates',
    'US': 'United States',
    'GB': 'United Kingdom',
    'SA': 'Saudi Arabia',
    'IN': 'India',
    'CA': 'Canada',
    'AU': 'Australia',
    'DE': 'Germany',
    'FR': 'France',
    // ... we can add more if needed, or rely on Intl.DisplayNames if on Edge
  };
  
  // Try to use Intl API if available in the runtime, otherwise fallback to map or code
  try {
    const regionNames = new Intl.DisplayNames(['en'], { type: 'region' });
    return regionNames.of(code) || names[code] || code;
  } catch {
    return names[code] || code;
  }
}
