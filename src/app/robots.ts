import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/config';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: 'Googlebot', allow: '/', disallow: ['/api/', '/drizzle/'] },
      { userAgent: 'Yeti', allow: '/', disallow: ['/api/', '/drizzle/'] },
      { userAgent: 'Bingbot', allow: '/', disallow: ['/api/', '/drizzle/'] },
      { userAgent: '*', allow: '/', disallow: ['/api/', '/drizzle/'] },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
