import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Sliding window: 30 requests per 60 seconds per IP
// Prevents analytics spam / scraping on /n/[uid] routes
export const tapRatelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(30, '60 s'),
  analytics: false,
  prefix: 'tapthat:tap',
});

// Stricter limit for upload endpoints
export const uploadRatelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '60 s'),
  analytics: false,
  prefix: 'tapthat:upload',
});
