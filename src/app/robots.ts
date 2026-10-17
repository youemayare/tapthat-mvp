import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://tapthat.vercel.app').replace(/\/$/, '');

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/dashboard/',
          '/admin/',
          '/api/',
          '/auth/',
          '/claim/',
          '/n/',
          '/remove-exchange/',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
