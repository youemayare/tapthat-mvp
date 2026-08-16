/**
 * Unit tests for the rate limiting configuration (src/lib/ratelimit.ts)
 *
 * Tests the fail-closed / fail-open behavior when Redis is unavailable.
 * Does NOT test Redis connectivity — that is an integration concern.
 *
 * Test strategy: mock the environment and verify the correct stub is returned.
 */

describe('ratelimit module — production fail behavior', () => {
  const ORIGINAL_ENV = process.env;

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
    jest.resetModules();
  });

  it('uploadRatelimit fails CLOSED in production without Redis', async () => {
    process.env = {
      ...ORIGINAL_ENV,
      NODE_ENV: 'production',
      UPSTASH_REDIS_REST_URL: '',
      UPSTASH_REDIS_REST_TOKEN: '',
    };
    const { uploadRatelimit } = await import('@/lib/ratelimit');
    const result = await uploadRatelimit.limit('test-ip');
    expect(result.success).toBe(false);
  });

  it('mutationRatelimit fails CLOSED in production without Redis', async () => {
    process.env = {
      ...ORIGINAL_ENV,
      NODE_ENV: 'production',
      UPSTASH_REDIS_REST_URL: '',
      UPSTASH_REDIS_REST_TOKEN: '',
    };
    const { mutationRatelimit } = await import('@/lib/ratelimit');
    const result = await mutationRatelimit.limit('user-id');
    expect(result.success).toBe(false);
  });

  it('vcardRatelimit fails CLOSED in production without Redis', async () => {
    process.env = {
      ...ORIGINAL_ENV,
      NODE_ENV: 'production',
      UPSTASH_REDIS_REST_URL: '',
      UPSTASH_REDIS_REST_TOKEN: '',
    };
    const { vcardRatelimit } = await import('@/lib/ratelimit');
    const result = await vcardRatelimit.limit('test-ip');
    expect(result.success).toBe(false);
  });

  it('tapRatelimit fails OPEN in production without Redis (public read)', async () => {
    process.env = {
      ...ORIGINAL_ENV,
      NODE_ENV: 'production',
      UPSTASH_REDIS_REST_URL: '',
      UPSTASH_REDIS_REST_TOKEN: '',
    };
    const { tapRatelimit } = await import('@/lib/ratelimit');
    const result = await tapRatelimit.limit('test-ip');
    // Public reads fail open — the tap is allowed but logged
    expect(result.success).toBe(true);
  });

  it('all limiters allow requests in development without Redis', async () => {
    process.env = {
      ...ORIGINAL_ENV,
      NODE_ENV: 'development',
      UPSTASH_REDIS_REST_URL: '',
      UPSTASH_REDIS_REST_TOKEN: '',
    };
    const { uploadRatelimit, mutationRatelimit, tapRatelimit } = await import('@/lib/ratelimit');
    expect((await uploadRatelimit.limit('x')).success).toBe(true);
    expect((await mutationRatelimit.limit('x')).success).toBe(true);
    expect((await tapRatelimit.limit('x')).success).toBe(true);
  });

  it('fail-closed response includes a non-zero reset timestamp in production', async () => {
    process.env = {
      ...ORIGINAL_ENV,
      NODE_ENV: 'production',
      UPSTASH_REDIS_REST_URL: '',
      UPSTASH_REDIS_REST_TOKEN: '',
    };
    const { uploadRatelimit } = await import('@/lib/ratelimit');
    const result = await uploadRatelimit.limit('test-ip');
    expect(result.reset).toBeGreaterThan(Date.now());
  });
});
