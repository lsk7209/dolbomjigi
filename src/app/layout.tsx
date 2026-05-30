import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import Script from 'next/script';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { SITE_URL, SITE_NAME } from '@/lib/config';
import './globals.css';

// ─────────────────────────────────────────
// 폰트
// ─────────────────────────────────────────

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

// ─────────────────────────────────────────
// 사이트 전체 메타태그 기본값
// ─────────────────────────────────────────

const DEFAULT_TITLE = `${SITE_NAME} - 돌봄로봇 종합 정보 포털`;
const DEFAULT_DESCRIPTION =
  '노인·장애인 돌봄로봇, 재활로봇, 지원사업 정보를 한눈에. 효돌, 다솜, 보미 등 국내 돌봄로봇 비교 가이드와 전국 지원사업 안내.';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: DEFAULT_TITLE,
    template: `%s | ${SITE_NAME}`,
  },
  description: DEFAULT_DESCRIPTION,
  keywords: [
    '돌봄로봇',
    '반려로봇',
    '효돌',
    '다솜',
    '노인 돌봄',
    '재활로봇',
    '시니어 로봇',
    'AI 돌봄',
    '돌봄로봇 지원사업',
    '독거노인 로봇',
  ],
  authors: [{ name: SITE_NAME, url: SITE_URL }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'ko_KR',
    url: SITE_URL,
    siteName: SITE_NAME,
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    images: [
      {
        url: `${SITE_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: `${SITE_NAME} - 돌봄로봇 종합 정보`,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    images: [`${SITE_URL}/og-image.png`],
  },
  alternates: {
    canonical: SITE_URL,
    types: {
      'application/rss+xml': `${SITE_URL}/feed.xml`,
    },
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
    other: {
      'naver-site-verification': process.env.NEXT_PUBLIC_NAVER_SITE_VERIFICATION ?? '',
    },
  },
};

// ─────────────────────────────────────────
// 루트 레이아웃
// ─────────────────────────────────────────

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        {/* RSS 피드 자동 감지 */}
        <link
          rel="alternate"
          type="application/rss+xml"
          title={`${SITE_NAME} RSS 피드`}
          href="/feed.xml"
        />
        {/* 파비콘 */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body className="min-h-full flex flex-col bg-white text-gray-900">
        {/* 헤더 */}
        <Header />

        {/* 메인 콘텐츠 */}
        <main className="flex-1">{children}</main>

        {/* 푸터 */}
        <Footer />

        {/* AdSense 자동 광고 */}
        {process.env.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID && (
          <Script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${process.env.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID}`}
            crossOrigin="anonymous"
            strategy="afterInteractive"
          />
        )}

        {/* Google Analytics 4 */}
        {GA_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
              strategy="afterInteractive"
            />
            <Script id="ga4-init" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${GA_ID}', {
                  page_path: window.location.pathname,
                  anonymize_ip: true,
                });
              `}
            </Script>
          </>
        )}
      </body>
    </html>
  );
}
