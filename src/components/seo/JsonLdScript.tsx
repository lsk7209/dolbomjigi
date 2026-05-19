import React from 'react'

interface JsonLdScriptProps {
  data: object | object[]
}

/**
 * JSON-LD 구조화 데이터를 <script type="application/ld+json"> 태그로 렌더링한다.
 *
 * @example
 * <JsonLdScript data={buildProductJsonLd(robot)} />
 * <JsonLdScript data={[buildBreadcrumbJsonLd(items), buildFAQJsonLd(faqs)]} />
 */
export default function JsonLdScript({ data }: JsonLdScriptProps) {
  const json = JSON.stringify(Array.isArray(data) ? data : data)

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: json }}
    />
  )
}
