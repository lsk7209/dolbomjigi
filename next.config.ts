import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ─── HTTP 헤더 ────────────────────────────────────────────────────────────
  async headers() {
    return [
      // 기본 보안·SEO 헤더 (전체 경로)
      {
        source: '/:path*',
        headers: [
          // 검색엔진 색인 지시
          {
            key: 'X-Robots-Tag',
            value: 'index, follow',
          },
          // XSS 방어
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
      // 정적 페이지 캐시 (로봇 상세, 가이드 등)
      {
        source: '/(robot|compare|guide|info|research)/:slug*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=86400, stale-while-revalidate=604800',
          },
        ],
      },
      // API 경로 캐시 없음
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate',
          },
          // API는 색인 불필요
          {
            key: 'X-Robots-Tag',
            value: 'noindex, nofollow',
          },
        ],
      },
      // RSS 피드 캐시
      {
        source: '/feed.xml',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=3600, stale-while-revalidate=86400',
          },
          {
            key: 'Content-Type',
            value: 'application/rss+xml; charset=UTF-8',
          },
        ],
      },
    ];
  },

  // ─── URL 리라이트 ─────────────────────────────────────────────────────────
  async rewrites() {
    return [
      // /feed.xml → /api/feed (실제 구현은 App Router route handler)
      {
        source: '/feed.xml',
        destination: '/api/feed',
      },
    ];
  },

  // ─── 이미지 외부 도메인 허용 ──────────────────────────────────────────────
  images: {
    remotePatterns: [
      // 효돌 공식 사이트
      {
        protocol: 'https',
        hostname: 'hyodol.com',
        pathname: '/**',
      },
      // 주요 로봇 제조사 이미지 CDN
      {
        protocol: 'https',
        hostname: '**.hyodol.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'img.youtube.com',
        pathname: '/**',
      },
      // 공공 기관 이미지
      {
        protocol: 'https',
        hostname: '**.go.kr',
        pathname: '/**',
      },
      // 일반 CDN
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'cdn.jsdelivr.net',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
