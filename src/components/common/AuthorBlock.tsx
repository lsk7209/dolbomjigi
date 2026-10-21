import React from 'react'
import { hasExpertReview, validRecordedDate, type ExpertReviewEvidence } from '@/lib/trust'

interface AuthorInfo {
  name: string
  role: string
  slug: string
}

interface ReviewerInfo {
  name: string
  credentials: string
  slug: string
}

interface AuthorBlockProps {
  author: AuthorInfo
  reviewer?: ReviewerInfo
  confirmedAt?: string // Legacy caller value is not evidence of checking.
  nextUpdateAt?: string // YYYY-MM-DD
  sourceCheckedAt?: string
  contentUpdatedAt?: string
  expertEvidence?: ExpertReviewEvidence
  contentVersion?: string
}

/**
 * 글 작성자·감수자·최종 확인일·다음 갱신 예정일을 표시하는 블록.
 *
 * E-E-A-T 신호 강화 및 AdSense 콘텐츠 품질 정책 대응용.
 */
export default function AuthorBlock({
  author,
  reviewer,
  sourceCheckedAt,
  contentUpdatedAt,
  expertEvidence,
  contentVersion,
}: AuthorBlockProps) {
  return (
    <aside
      aria-label="작성자 및 콘텐츠 신뢰 정보"
      className="flex flex-col gap-2 border border-gray-200 rounded-lg px-5 py-4 bg-gray-50 text-sm text-gray-700"
    >
      {/* 작성자 */}
      <div className="flex items-center gap-2">
        <span className="font-semibold text-gray-900">작성</span>
        <a
          href={`/authors/${author.slug === 'editorial-team' ? 'editor-team' : author.slug}`}
          className="text-blue-600 hover:underline font-medium"
        >
          {author.name}
        </a>
        {author.role && (
          <span className="text-gray-500">({author.role})</span>
        )}
      </div>

      {/* 감수자 (선택) */}
      {reviewer && hasExpertReview(expertEvidence, contentVersion) && (
        <div className="flex items-center gap-2">
          <span className="font-semibold text-gray-900">감수</span>
          <a
            href={`/authors/${reviewer.slug}`}
            className="text-blue-600 hover:underline font-medium"
          >
            {reviewer.name}
          </a>
          {reviewer.credentials && (
            <span className="text-gray-500">({reviewer.credentials})</span>
          )}
        </div>
      )}

      {/* 날짜 정보 */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-gray-500 mt-1">
        {validRecordedDate(sourceCheckedAt) ? <time dateTime={sourceCheckedAt}>
          원문 대조일: <span className="text-gray-700">{sourceCheckedAt}</span>
        </time> : <span>원문 대조일: 확인 기록 없음</span>}
        {validRecordedDate(contentUpdatedAt) && (
          <time dateTime={contentUpdatedAt}>
            내용 수정일: <span className="text-gray-700">{contentUpdatedAt}</span>
          </time>
        )}
      </div>
    </aside>
  )
}
