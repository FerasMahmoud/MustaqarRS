import { MetadataRoute } from 'next';
import { getAllRooms } from '@/lib/db';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://qurtubah.com';

/**
 * Dynamic sitemap generation for SEO
 * Includes all static pages and dynamic room pages in both locales
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const rooms = getAllRooms();
  const locales = ['en', 'ar'];
  const now = new Date().toISOString();

  // Static pages per locale
  const staticPages = locales.flatMap((locale) => [
    {
      url: `${BASE_URL}/${locale}`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/${locale}/terms`,
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/${locale}/privacy`,
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/${locale}/faq`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    },
  ]);

  // Dynamic room pages
  const roomPages = rooms.flatMap((room) =>
    locales.map((locale) => ({
      url: `${BASE_URL}/${locale}/book/${room.slug}`,
      lastModified: room.updated_at || now,
      changeFrequency: 'daily' as const,
      priority: 0.8,
    }))
  );

  return [...staticPages, ...roomPages];
}
