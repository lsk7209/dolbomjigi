import React from 'react'

type SourceType = 'government' | 'research' | 'media' | 'official'

interface Source {
  type: SourceType
  label: string
  url?: string
  date?: string
  license?: string
}

interface SourcesProps {
  sources: Source[]
}

const TYPE_LABEL: Record<SourceType, string> = {
  government: '정부·공공기관',
  research:   '연구·학술',
  media:      '언론·미디어',
  official:   '공식 자료',
}

const TYPE_COLOR: Record<SourceType, string> = {
  government: 'bg-blue-100 text-blue-800',
  research:   'bg-purple-100 text-purple-800',
  media:      'bg-green-100 text-green-800',
  official:   'bg-gray-100 text-gray-800',
}

/**
 * 페이지 하단 출처 목록 렌더링 컴포넌트.
 *
 * government / research / media / official 네 가지 유형을 뱃지로 구분하며,
 * URL이 있는 경우 외부 링크로, 없는 경우 텍스트로 표시한다.
 */
export default function Sources({ sources }: SourcesProps) {
  if (sources.length === 0) return null

  return (
    <section aria-label="참고 출처" className="mt-8 border-t border-gray-200 pt-6">
      <h2 className="text-sm font-semibold text-gray-700 mb-3">참고 출처</h2>
      <ol className="flex flex-col gap-2">
        {sources.map((source, index) => (
          <li key={index} className="flex flex-wrap items-start gap-2 text-sm text-gray-700">
            {/* 유형 뱃지 */}
            <span
              className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium shrink-0 ${TYPE_COLOR[source.type]}`}
            >
              {TYPE_LABEL[source.type]}
            </span>

            {/* 출처 이름 (링크 or 텍스트) */}
            {source.url ? (
              <a
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                {source.label}
              </a>
            ) : (
              <span>{source.label}</span>
            )}

            {/* 날짜 */}
            {source.date && (
              <time dateTime={source.date} className="text-gray-400">
                ({source.date})
              </time>
            )}

            {/* 라이선스 */}
            {source.license && (
              <span className="text-gray-400 text-xs">
                [{source.license}]
              </span>
            )}
          </li>
        ))}
      </ol>
    </section>
  )
}
