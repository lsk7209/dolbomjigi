import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/config";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "Googlebot", allow: "/", disallow: ["/api/", "/drizzle/"] },
      { userAgent: "Yeti", allow: "/", disallow: ["/api/", "/drizzle/"] },
      { userAgent: "Bingbot", allow: "/", disallow: ["/api/", "/drizzle/"] },
      { userAgent: "*", allow: "/", disallow: ["/api/", "/drizzle/"] },
      // AI 크롤러 허용 (GEO 전략)
      { userAgent: "GPTBot", allow: "/" },
      { userAgent: "ClaudeBot", allow: "/" },
      { userAgent: "anthropic-ai", allow: "/" },
      { userAgent: "PerplexityBot", allow: "/" },
      { userAgent: "OAI-SearchBot", allow: "/" },
      { userAgent: "Google-Extended", allow: "/" },
      { userAgent: "Daumoa", allow: "/" },
      // 비매너 크롤러 차단
      { userAgent: "Bytespider", disallow: "/" },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
