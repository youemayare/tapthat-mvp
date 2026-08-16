import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// ─── Redis availability check ─────────────────────────────────────────────────

const hasRedis =
  !!process.env.UPSTASH_REDIS_REST_URL &&
  process.env.UPSTASH_REDIS_REST_URL.startsWith('https://') &&
  !!process.env.UPSTASH_REDIS_REST_TOKEN;

// Emit a critical warning at module load time when Redis is absent in production.
// This surfaces immediately in Vercel function logs rather than silently failing.
if (!hasRedis && process.env.NODE_ENV === 'production') {
  console.error(
    JSON.stringify({
      level: 'critical',
      message:
        'UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN are not configured. ' +
        'Rate limiting is DISABLED. Sensitive routes (uploads, mutations, vCard) ' +
        'will reject requests with 503 until Redis is configured.',
    })
  );
}

// ─── Fail-closed stub ────────────────────────────────────────────────────────
//
// Sensitive routes (uploads, mutations, vCard generation) FAIL CLOSED when Redis
// is unavailable in production. This prevents protection from being silently
// bypassed by a misconfiguration.
//
// Public-read routes (public profile views, tap analytics) FAIL OPEN with a
// logged warning — a brief unprotected public-read window is acceptable; blocking
// all profile views on a Redis outage is not.

type RatelimitResult = { success: boolean; limit: number; remaining: number; reset: number };

const failClosed = {
  limit: async (): Promise<RatelimitResult> => {
    if (process.env.NODE_ENV === 'production') {
      return { success: false, limit: 0, remaining: 0, reset: Date.now() + 30_000 };
    }
    // In development, allow requests so local testing is not blocked
    return { success: true, limit: 999, remaining: 999, reset: 0 };
  },
};

const failOpen = {
  limit: async (): Promise<RatelimitResult> => {
    if (process.env.NODE_ENV === 'production') {
      console.warn(
        JSON.stringify({
          level: 'warn',
          message: 'Rate limiter unavailable (no Redis). Allowing public read request.',
        })
      );
    }
    return { success: true, limit: 999, remaining: 999, reset: 0 };
  },
};

// ─── Rate limit constants ─────────────────────────────────────────────────────

export const RATE_LIMITS = {
  TAP_LIMIT: 30,            // Taps per minute per IP
  UPLOAD_LIMIT: 10,         // Uploads per minute per IP + user
  CLAIM_LIMIT: 5,           // Claim attempts per 15 mins per IP
  PUBLIC_PROFILE_LIMIT: 60, // Profile views per minute per IP
  AUTH_ROUTE_LIMIT: 10,     // Auth attempts per minute per IP + route
  MUTATION_LIMIT: 30,       // Authenticated mutations per minute per user
  VCARD_LIMIT: 20,          // vCard downloads per minute per IP
};

// ─── Redis client (lazy, only if configured) ─────────────────────────────────

const redis = hasRedis ? Redis.fromEnv() : null;

function makeRatelimit(
  limiter: Ratelimit['limiter'],
  prefix: string
): Ratelimit {
  return new Ratelimit({
    // redis will be non-null here because we only call this when hasRedis is true
    redis: redis!,
    limiter,
    analytics: false,
    prefix,
  });
}

// ─── Public / analytics routes (fail open) ───────────────────────────────────

/** Tap analytics logging — 30 taps/min per IP */
export const tapRatelimit = hasRedis
  ? makeRatelimit(Ratelimit.slidingWindow(RATE_LIMITS.TAP_LIMIT, '60 s'), 'anoya:tap')
  : failOpen;

/** Public profile page hits — 60/min per IP */
export const publicProfileRatelimit = hasRedis
  ? makeRatelimit(Ratelimit.slidingWindow(RATE_LIMITS.PUBLIC_PROFILE_LIMIT, '60 s'), 'anoya:pub_profile')
  : failOpen;

// ─── Sensitive routes (fail closed) ──────────────────────────────────────────

/** File uploads — 10/min per IP (fail closed) */
export const uploadRatelimit = hasRedis
  ? makeRatelimit(Ratelimit.slidingWindow(RATE_LIMITS.UPLOAD_LIMIT, '60 s'), 'anoya:upload')
  : failClosed;

/** Card claim attempts — 5 per 15 min per IP (fail closed) */
export const claimRatelimit = hasRedis
  ? makeRatelimit(Ratelimit.slidingWindow(RATE_LIMITS.CLAIM_LIMIT, '15 m'), 'anoya:claim')
  : failClosed;

/** Auth endpoints — 10/min per IP (fail closed) */
export const authRouteRatelimit = hasRedis
  ? makeRatelimit(Ratelimit.slidingWindow(RATE_LIMITS.AUTH_ROUTE_LIMIT, '60 s'), 'anoya:auth')
  : failClosed;

/**
 * Authenticated mutation routes (profile, cards, user settings) — 30/min per user.
 * Key on user ID so shared-IP environments (NAT, offices) don't cause false positives.
 * Fail closed in production without Redis.
 */
export const mutationRatelimit = hasRedis
  ? makeRatelimit(Ratelimit.slidingWindow(RATE_LIMITS.MUTATION_LIMIT, '60 s'), 'anoya:mutation')
  : failClosed;

/**
 * vCard download generation — 20/min per IP (fail closed).
 * Applied before the profile query so enumeration attempts are limited.
 */
export const vcardRatelimit = hasRedis
  ? makeRatelimit(Ratelimit.slidingWindow(RATE_LIMITS.VCARD_LIMIT, '60 s'), 'anoya:vcard')
  : failClosed;
