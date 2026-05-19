import React from 'react'

interface AnswerBlockProps {
  children: React.ReactNode
}

/**
 * 핵심 답변 블록 — AEO(Answer Engine Optimization) 및 LLM citation 최적화용.
 *
 * - 250자 이내 핵심 답변을 담는다.
 * - 파란 왼쪽 보더와 밝은 배경으로 시각적으로 구별된다.
 * - role="note" aria-label="핵심 요약" 으로 시맨틱 마크업을 제공한다.
 *
 * @example
 * <AnswerBlock>
 *   돌봄 로봇 렌탈 신청은 주민센터 또는 복지관 방문으로 가능합니다.
 * </AnswerBlock>
 */
export default function AnswerBlock({ children }: AnswerBlockProps) {
  return (
    <div
      role="note"
      aria-label="핵심 요약"
      className="border-l-4 border-blue-500 bg-blue-50 px-5 py-4 rounded-r-md text-gray-800 text-sm leading-relaxed"
    >
      {children}
    </div>
  )
}
