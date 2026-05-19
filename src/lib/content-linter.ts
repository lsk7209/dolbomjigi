import type { LintResult } from '@/types'

/**
 * AdSense 정책 준수를 위한 금지 의료 표현
 */
const FORBIDDEN_MEDICAL: string[] = [
  '치매 예방',
  '치매예방',
  '치료',
  '처방',
  '의료기기',
  '환자',
  '진단',
  '효능',
  '약효',
  '처치',
  '부작용',
  '임상 결과',
  '의사 추천',
  '만병통치',
  'FDA 승인',
  '100% 효과',
  '100% 안전',
  '즉시 효과',
]

/**
 * AdSense 정책 준수를 위한 금지 과장 홍보 표현
 */
const FORBIDDEN_PROMOTIONAL: string[] = [
  '최고의',
  '1등 추천',
  '무조건 추천',
  '강력 추천',
  '후회 없는',
  '단 한 번뿐',
  '후회없는',
]

/**
 * 인용 블록(blockquote 태그 또는 마크다운 > 인용)을 텍스트에서 제거한다.
 * 인용 내부의 표현은 검사 대상에서 제외한다.
 */
function stripQuoteBlocks(text: string): string {
  // HTML <blockquote>...</blockquote> 제거 (중첩 포함, 개행 포함)
  const withoutHtmlBlockquote = text.replace(/<blockquote[\s\S]*?<\/blockquote>/gi, '')

  // 마크다운 인용 블록 제거: 연속된 "> " 로 시작하는 줄 전체를 제거
  const lines = withoutHtmlBlockquote.split('\n')
  const filteredLines = lines.filter((line) => !/^\s*>/.test(line))
  return filteredLines.join('\n')
}

/**
 * 주어진 텍스트에서 금지어 목록 중 포함된 단어를 반환한다.
 */
function findViolations(text: string, forbidden: string[]): string[] {
  return forbidden.filter((term) => text.includes(term))
}

/**
 * 돌봄지기 콘텐츠 품질 검사기
 *
 * @param text - 검사할 텍스트 (HTML 또는 마크다운 포함 가능)
 * @returns LintResult - 위반 여부 및 위반 항목 목록
 *
 * @example
 * const result = lintContent('어르신 치료를 도와드립니다.')
 * // { ok: false, violations: { medical: ['치료'], promotional: [] } }
 */
export function lintContent(text: string): LintResult {
  const cleaned = stripQuoteBlocks(text)

  const medical = findViolations(cleaned, FORBIDDEN_MEDICAL)
  const promotional = findViolations(cleaned, FORBIDDEN_PROMOTIONAL)

  return {
    ok: medical.length === 0 && promotional.length === 0,
    violations: { medical, promotional },
  }
}

export { FORBIDDEN_MEDICAL, FORBIDDEN_PROMOTIONAL }
