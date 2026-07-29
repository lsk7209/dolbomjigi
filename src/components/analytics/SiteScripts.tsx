'use client'

import Script from 'next/script'
import { usePathname } from 'next/navigation'
import { useEffect } from 'react'

const MONETIZED_ROUTE_PREFIXES = [
  '/blog',
  '/business',
  '/compare',
  '/guide',
  '/info',
  '/ranking',
  '/research',
  '/robot',
  '/support',
] as const

function isMonetizedPath(pathname: string) {
  if (pathname === '/') return true

  return MONETIZED_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  )
}

declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: (...args: unknown[]) => void
  }
}

interface SiteScriptsProps {
  adsensePublisherId: string
  gaId: string
}

export default function SiteScripts({ adsensePublisherId, gaId }: SiteScriptsProps) {
  const pathname = usePathname()

  useEffect(() => {
    if (!window.gtag) return

    window.gtag('config', gaId, {
      page_path: pathname,
      anonymize_ip: true,
    })
  }, [gaId, pathname])

  return (
    <>
      {isMonetizedPath(pathname) && (
        <Script
          async
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsensePublisherId}`}
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
      )}

      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
        strategy="afterInteractive"
      />
      <Script id="ga4-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          window.gtag = gtag;
          gtag('js', new Date());
          gtag('config', '${gaId}', {
            page_path: window.location.pathname,
            anonymize_ip: true,
          });
        `}
      </Script>
    </>
  )
}
