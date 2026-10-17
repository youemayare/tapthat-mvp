import type { MetadataRoute } from 'next';
import { db } from '@/lib/db';
import { profiles, users } from '@/lib/db/schema';
import { and, eq, isNull } from 'drizzle-orm';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://tapthat.vercel.app').replace(/\/$/, '');

  const entries: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/login`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/signup`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
  ];

  try {
    const publishedProfiles = await db
      .select({
        slug: profiles.slug,
        updatedAt: profiles.updatedAt,
        handle: users.handle,
      })
      .from(profiles)
      .leftJoin(users, eq(profiles.userId, users.id))
      .where(and(eq(profiles.isPublished, true), isNull(profiles.archivedAt)))
      .limit(2000);

    const seenUrls = new Set<string>(entries.map((e) => e.url));

    for (const row of publishedProfiles) {
      if (row.handle) {
        const handleUrl = `${baseUrl}/${encodeURIComponent(row.handle)}`;
        if (!seenUrls.has(handleUrl)) {
          seenUrls.add(handleUrl);
          entries.push({
            url: handleUrl,
            lastModified: row.updatedAt ?? new Date(),
            changeFrequency: 'weekly',
            priority: 0.8,
          });
        }
      }

      if (row.slug) {
        const slugUrl = `${baseUrl}/p/${encodeURIComponent(row.slug)}`;
        if (!seenUrls.has(slugUrl)) {
          seenUrls.add(slugUrl);
          entries.push({
            url: slugUrl,
            lastModified: row.updatedAt ?? new Date(),
            changeFrequency: 'weekly',
            priority: 0.7,
          });
        }
      }
    }
  } catch {
    // Graceful fallback if DB is unreachable at build time
  }

  return entries;
}
