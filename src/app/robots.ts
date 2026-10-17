import type { MetadataRoute } from 'next';
import { getBaseUrl } from '@/lib/utils';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getBaseUrl();

  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/api/og/'],
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
