import type { NextConfig } from "next";

// Explicit list of known media hostnames.
// This eliminates the wildcard SSRF vector while allowing legitimate image optimization.
// Update this list when adding new media hosts (e.g. custom R2 CDN domain).
const R2_PUBLIC_URL = process.env.NEXT_PUBLIC_R2_PUBLIC_URL ?? '';
let r2Hostname = '';
try {
  r2Hostname = new URL(R2_PUBLIC_URL).hostname;
} catch {
  // env not set during build — allowed hostnames will be empty (no R2 in dev)
}

const allowedImageHostnames = [
  // Cloudflare R2 public buckets (*.r2.dev)
  '*.r2.dev',
  // Custom R2 CDN domain from env (e.g. cdn.anoya.app)
  ...(r2Hostname ? [r2Hostname] : []),
  // Supabase storage (used for avatars in some auth flows)
  '*.supabase.co',
  // Google avatars (OAuth profile pictures)
  'lh3.googleusercontent.com',
].filter(Boolean);

// Content-Security-Policy in Report-Only mode.
// This monitors real-world violations without breaking existing behaviour.
// Promote to enforcing (Content-Security-Policy) after reviewing violation reports.
//
// Origins included:
//  - Supabase:  auth, REST API, Realtime websocket
//  - Upstash:   Redis REST calls
//  - R2:        media / avatar / CV downloads
//  - Fonts:     Google Fonts (stylesheet + fonts)
//  - Vercel:    analytics and speed-insights scripts
//
// unsafe-inline is retained for style-src because Next.js injects inline styles.
// unsafe-eval is NOT included — no verified dependency requires it.
// Tighten this progressively: remove unsafe-inline from script-src once
// nonce-based CSP is implemented.
const CSP_REPORT_ONLY = [
  "default-src 'self'",
  // Next.js inlines JS chunks during hydration; hash/nonce-based hardening is a follow-up
  "script-src 'self' 'unsafe-inline' https://vercel.live https://*.vercel-scripts.com",
  // Inline styles from Next.js and component libraries
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  // Images: self, data URIs, blobs (canvas), and controlled external media only
  `img-src 'self' data: blob: https://*.r2.dev https://*.supabase.co https://lh3.googleusercontent.com${r2Hostname ? ` https://${r2Hostname}` : ''}`,
  // fetch() targets: own API, Supabase, Upstash, R2
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.upstash.io https://*.r2.dev",
  // No frame embedding allowed
  "frame-ancestors 'none'",
  // PDFs and media loaded from R2
  `media-src 'self' https://*.r2.dev${r2Hostname ? ` https://${r2Hostname}` : ''}`,
  "object-src 'none'",
  "base-uri 'self'",
].join('; ');

const nextConfig: NextConfig = {
  images: {
    remotePatterns: allowedImageHostnames.map((hostname) => ({
      protocol: 'https' as const,
      hostname,
    })),
  },

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // Prevent MIME-type sniffing
          { key: 'X-Content-Type-Options', value: 'nosniff' },

          // Deny framing globally (also enforced in CSP)
          { key: 'X-Frame-Options', value: 'DENY' },

          // Referrer: send origin only for cross-origin requests
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },

          // Permissions: disable browser features not used by this app
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
          },

          // HSTS: only emit over production HTTPS (Vercel sets NODE_ENV=production)
          // max-age=63072000 = 2 years; preload-eligible
          ...(process.env.NODE_ENV === 'production'
            ? [
                {
                  key: 'Strict-Transport-Security',
                  value: 'max-age=63072000; includeSubDomains; preload',
                },
              ]
            : []),

          // CSP in report-only mode — violations are logged but not blocked
          // Change to Content-Security-Policy after validating no legitimate violations
          { key: 'Content-Security-Policy-Report-Only', value: CSP_REPORT_ONLY },
        ],
      },
      {
        // Authenticated/private API routes must never be publicly cached
        source: '/api/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'no-store' },
        ],
      },
    ];
  },
};

export default nextConfig;
