import React from 'react'

interface UpdateNoticeProps {
  sourceUrl: string
  sourceName: string
  license: string        // e.g. '공공누리 제1유형'
  confirmedAt: string    // YYYY-MM-DD
  publicationDate?: string
}

/**
 * T4 지원사업 페이지용 출처·라이선스 표시 컴포넌트.
 *
 * 공공데이터 활용 시 공공누리 라이선스 고지 의무를 충족하고,
 * 콘텐츠 최신성 신호를 명시한다.
 *
 * @example
 * <UpdateNotice
 *   sourceUrl="https://www.bokjiro.go.kr/..."
 *   sourceName="복지로"
 *   license="공공누리 제1유형"
 *   confirmedAt="2026-05-19"
 * />
 */
export default function UpdateNotice({
  sourceUrl,
  sourceName,
  license,
  confirmedAt,
  publicationDate,
}: UpdateNoticeProps) {
  return (
    <aside
      aria-label="출처 및 라이선스 안내"
      className="flex flex-col gap-1 border border-amber-200 rounded-lg px-5 py-4 bg-amber-50 text-sm text-gray-700"
    >
      <p className="font-semibold text-amber-800">출처 및 이용 안내</p>

      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1">
        {/* 출처 */}
        <span>
          출처:{' '}
          <a
            href={sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            {sourceName}
          </a>
        </span>

        {/* 라이선스 */}
        <span className="text-gray-600">
          라이선스: <span className="font-medium text-gray-800">{license}</span>
        </span>
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1 text-gray-500 mt-1">
        {publicationDate && (
          <time dateTime={publicationDate}>
            원문 게시일: <span className="text-gray-700">{publicationDate}</span>
          </time>
        )}
        <time dateTime={confirmedAt}>
          내용 확인일: <span className="text-gray-700">{confirmedAt}</span>
        </time>
      </div>

      <p className="text-xs text-gray-500 mt-1">
        이 페이지는 공공데이터를 활용하여 작성되었으며, 실제 지원 내용은 해당 기관에 직접 확인하시기 바랍니다.
      </p>
    </aside>
  )
}
