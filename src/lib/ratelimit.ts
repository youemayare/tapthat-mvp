import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const hasRedis = 
  !!process.env.UPSTASH_REDIS_REST_URL && 
  process.env.UPSTASH_REDIS_REST_URL.startsWith('https://') &&
  !!process.env.UPSTASH_REDIS_REST_TOKEN;

// Configurable Constants for easy tweaking
export const RATE_LIMITS = {
  TAP_LIMIT: 30, // Taps per minute per IP
  UPLOAD_LIMIT: 10, // Uploads per minute per IP
  CLAIM_LIMIT: 5, // Claim attempts per 15 mins per IP
  PUBLIC_PROFILE_LIMIT: 60, // Profile views per minute per IP
  AUTH_ROUTE_LIMIT: 10, // Auth attempts per minute per IP + Route
};

// Sliding window: 30 requests per 60 seconds per IP
// Prevents analytics spam / scraping on /n/[uid] routes
export const tapRatelimit = hasRedis ? new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(RATE_LIMITS.TAP_LIMIT, '60 s'),
  analytics: false,
  prefix: 'tapthat:tap',
}) : {
  limit: async () => ({ success: true }),
};

// Stricter limit for upload endpoints
export const uploadRatelimit = hasRedis ? new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(RATE_LIMITS.UPLOAD_LIMIT, '60 s'),
  analytics: false,
  prefix: 'tapthat:upload',
}) : {
  limit: async () => ({ success: true }),
};

// Strict limit for claim attempts (5 attempts per 15 minutes)
export const claimRatelimit = hasRedis ? new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(RATE_LIMITS.CLAIM_LIMIT, '15 m'),
  analytics: false,
  prefix: 'tapthat:claim',
}) : {
  limit: async () => ({ success: true }),
};

// Protects public profiles and tap redirect routes from Vercel Serverless abuse
export const publicProfileRatelimit = hasRedis ? new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(RATE_LIMITS.PUBLIC_PROFILE_LIMIT, '60 s'),
  analytics: false,
  prefix: 'tapthat:public_profile',
}) : {
  limit: async () => ({ success: true }),
};

// Protects auth endpoints (login, signup, etc.) from brute force
export const authRouteRatelimit = hasRedis ? new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(RATE_LIMITS.AUTH_ROUTE_LIMIT, '60 s'),
  analytics: false,
  prefix: 'tapthat:auth',
}) : {
  limit: async () => ({ success: true }),
};
