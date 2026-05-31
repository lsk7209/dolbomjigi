/**
 * 색인 요청 유틸리티
 * - IndexNow: Bing/Naver/Yandex 즉시 색인 요청
 * - GSC Sitemap: Google Search Console sitemap 재제출
 */

import { SITE_URL } from './config'

const DEFAULT_INDEXNOW_KEY = '69109da07286e7121d74badfbb2dd62efad1389fe3b357e5'
const INDEXNOW_KEY = process.env.INDEXNOW_KEY ?? DEFAULT_INDEXNOW_KEY
const GSC_SERVICE_ACCOUNT_KEY = process.env.GSC_SERVICE_ACCOUNT_KEY ?? ''

// ─────────────────────────────────────────
// IndexNow
// ─────────────────────────────────────────

/**
 * IndexNow API로 URL 목록을 Bing/Naver에 제출한다.
 */
export async function pingIndexNow(urls: string[]): Promise<{ ok: boolean; error?: string }> {
  if (!INDEXNOW_KEY) return { ok: false, error: 'INDEXNOW_KEY 미설정' }
  if (urls.length === 0) return { ok: true }

  const host = new URL(SITE_URL).hostname
  const keyLocation = `${SITE_URL}/${INDEXNOW_KEY}.txt`

  try {
    const res = await fetch('https://api.indexnow.org/IndexNow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ key: INDEXNOW_KEY, keyLocation, host, urlList: urls }),
    })
    if (res.ok || res.status === 202) return { ok: true }
    const body = await res.text().catch(() => '')
    return { ok: false, error: `IndexNow ${res.status}: ${body}` }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) }
  }
}

// ─────────────────────────────────────────
// GSC Sitemap 재제출
// ─────────────────────────────────────────

/**
 * Google Search Console API로 sitemap.xml을 재제출한다.
 * GSC_SERVICE_ACCOUNT_KEY 환경변수에 서비스 계정 JSON이 있어야 한다.
 */
export async function pingGscSitemap(): Promise<{ ok: boolean; error?: string }> {
  if (!GSC_SERVICE_ACCOUNT_KEY) return { ok: false, error: 'GSC_SERVICE_ACCOUNT_KEY 미설정' }

  try {
    const serviceAccount = parseServiceAccount(GSC_SERVICE_ACCOUNT_KEY)
    if (!serviceAccount?.client_email || !serviceAccount.private_key) {
      return { ok: false, error: 'GSC_SERVICE_ACCOUNT_KEY 형식 오류' }
    }

    // JWT 생성 (Google OAuth2 서비스 계정)
    const token = await getGoogleAccessToken(serviceAccount)
    if (!token) return { ok: false, error: 'Google 액세스 토큰 발급 실패' }

    const sitemapUrl = `${SITE_URL}/sitemap.xml`
    const siteUrl = encodeURIComponent(SITE_URL + '/')
    const encodedSitemap = encodeURIComponent(sitemapUrl)

    const res = await fetch(
      `https://www.googleapis.com/webmasters/v3/sites/${siteUrl}/sitemaps/${encodedSitemap}`,
      {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      }
    )

    if (res.ok || res.status === 204) return { ok: true }
    const body = await res.text().catch(() => '')
    return { ok: false, error: `GSC ${res.status}: ${body}` }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) }
  }
}

// ─────────────────────────────────────────
// JWT 헬퍼
// ─────────────────────────────────────────

function parseServiceAccount(value: string): { client_email: string; private_key: string } | null {
  try {
    return JSON.parse(value) as { client_email: string; private_key: string }
  } catch {
    try {
      const decoded = atob(value)
      return JSON.parse(decoded) as { client_email: string; private_key: string }
    } catch {
      return null
    }
  }
}

async function getGoogleAccessToken(sa: {
  client_email: string
  private_key: string
}): Promise<string | null> {
  try {
    const now = Math.floor(Date.now() / 1000)
    const header = { alg: 'RS256', typ: 'JWT' }
    const payload = {
      iss: sa.client_email,
      scope: 'https://www.googleapis.com/auth/webmasters',
      aud: 'https://oauth2.googleapis.com/token',
      iat: now,
      exp: now + 3600,
    }

    const b64 = (obj: object) =>
      btoa(JSON.stringify(obj)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')

    const signingInput = `${b64(header)}.${b64(payload)}`

    // RSA-SHA256 서명 (Web Crypto API)
    const pemKey = sa.private_key
      .replace(/-----BEGIN PRIVATE KEY-----/, '')
      .replace(/-----END PRIVATE KEY-----/, '')
      .replace(/\s/g, '')

    const binaryKey = Uint8Array.from(atob(pemKey), (c) => c.charCodeAt(0))
    const cryptoKey = await crypto.subtle.importKey(
      'pkcs8', binaryKey,
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false, ['sign']
    )

    const sig = await crypto.subtle.sign(
      'RSASSA-PKCS1-v1_5',
      cryptoKey,
      new TextEncoder().encode(signingInput)
    )

    const sigB64 = btoa(String.fromCharCode(...new Uint8Array(sig)))
      .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')

    const jwt = `${signingInput}.${sigB64}`

    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
    })

    const data = (await res.json()) as { access_token?: string }
    return data.access_token ?? null
  } catch {
    return null
  }
}
