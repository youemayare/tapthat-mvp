import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const hasRedis = 
  !!process.env.UPSTASH_REDIS_REST_URL && 
  process.env.UPSTASH_REDIS_REST_URL.startsWith('https://') &&
  !!process.env.UPSTASH_REDIS_REST_TOKEN;

// Sliding window: 30 requests per 60 seconds per IP
// Prevents analytics spam / scraping on /n/[uid] routes
export const tapRatelimit = hasRedis ? new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(30, '60 s'),
  analytics: false,
  prefix: 'tapthat:tap',
}) : {
  limit: async () => ({ success: true }),
};

// Stricter limit for upload endpoints
// Stricter limit for upload endpoints
export const uploadRatelimit = hasRedis ? new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '60 s'),
  analytics: false,
  prefix: 'tapthat:upload',
}) : {
  limit: async () => ({ success: true }),
};
