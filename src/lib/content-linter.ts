import type { LintResult } from '@/types'

/**
 * AdSense 정책 준수를 위한 금지 의료 표현
 */
const FORBIDDEN_MEDICAL: string[] = [
  '치료',
  '진단',
  '의료기기',
  '효능',
  '치매 예방',
  '치매예방',
  '치료 효과',
  '효능 보장',
  '약효',
  '임상 결과 조작',
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

/** 인용도 검사하며 좁은 부정 설명만 제외한다. 사실 승인을 수행하지 않는다. */
function medicalClaimText(text: string): string {
  // Quotes remain in scope. Only narrow negative explanations are removed,
  // never an entire sentence containing a negation and another positive claim.
  return text.replace(/<[^>]*>/g, ' ')
    .replace(/의료기기(?:가|는)?\s*아닙니다/g, '')
    .replace(/치료\s*효과(?:를|는)?\s*보장하지\s*않습니다/g, '')
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
  const cleaned = medicalClaimText(text)

  const medical = findViolations(cleaned, FORBIDDEN_MEDICAL)
  const promotional = findViolations(cleaned, FORBIDDEN_PROMOTIONAL)

  return {
    ok: medical.length === 0 && promotional.length === 0,
    violations: { medical, promotional },
  }
}

export { FORBIDDEN_MEDICAL, FORBIDDEN_PROMOTIONAL }
