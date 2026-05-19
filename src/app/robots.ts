/**
 * Next.js 15 robots.txt 생성
 * /robots.txt 엔드포인트로 자동 서빙된다.
 */

import type { MetadataRoute } from 'next';

const SITE_URL = 'https://dolbomjigi.com';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // Googlebot - 전체 허용 (API, 관리 경로 제외)
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: ['/api/', '/drizzle/'],
      },
      // Naver 검색봇 (Yeti)
      {
        userAgent: 'Yeti',
        allow: '/',
        disallow: ['/api/', '/drizzle/'],
      },
      // Bing 검색봇
      {
        userAgent: 'Bingbot',
        allow: '/',
        disallow: ['/api/', '/drizzle/'],
      },
      // 기타 모든 봇 - 공개 경로 허용
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/drizzle/'],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
