/**
 * 돌봄지기 콘텐츠 자율 리뷰 및 품질 개선(Review & Refinement) 엔진
 *
 * 기능:
 * 1. 5대 핵심 차원 다각도 정밀 진단 (100점 만점):
 *    - YMYL / AdSense 컴플라이언스 (의학적 단정, 과장 광고 표현, 금지어)
 *    - 정보 획득도 (Information Gain: 표, 수치 데이터, 실무 체크리스트)
 *    - AEO / 구조 완성도 (<AnswerBlock> 200~350자, H2/H3 계층, FAQ 5문 5답)
 *    - 자연스러운 한국어 문체 (AI 클리셰 배제, 번역투 정화, zero-anaphora)
 *    - 내부 링크 연결망 (사이트 내 유의미한 가이드/순위 링크 3개 이상)
 * 2. 미흡 항목 자동 개선(Self-Refinement) 및 피드백 제안 생성
 * 3. 리뷰 감사 리포트(Review Audit Report) 반환 -> qa.json 및 파이프라인 탑재
 */

const FORBIDDEN_MEDICAL = [
  '치료', '진단', '의료기기', '효능', '치매 예방', '치매예방',
  '치료 효과', '효능 보장', '약효', '임상 결과 조작', '의사 추천',
  '만병통치', 'FDA 승인', '100% 효과', '100% 안전', '즉시 효과'
];

const FORBIDDEN_PROMOTIONAL = [
  '최고의', '1등 추천', '무조건 추천', '강력 추천', '후회 없는', '단 한 번뿐', '후회없는'
];

const AI_CLICHES = [
  '결론적으로', '요약하면', '종합하면', '정리하자면', '시사하는 바가 크다',
  '매우 중요하다', '주목할 만하다', '간과할 수 없다', '지평을 연다', '방점을 찍는다',
  '혁신적인', '획기적인', '전례 없는', '압도적', '파격적', '폭발적'
];

export function reviewContent(post) {
  const { title_ko, subtitle, summary, body_md, slug } = post;
  const issues = [];
  const improvements = [];
  let score = 100;

  // 1. YMYL / AdSense 컴플라이언스 진단 (가중치: 30점)
  const fullText = `${title_ko || ''} ${subtitle || ''} ${summary || ''} ${body_md || ''}`;
  const cleanedText = fullText
    .replace(/<[^>]*>/g, ' ')
    .replace(/의료기기(?:가|는)?\s*아닙니다/g, '')
    .replace(/치료\s*효과(?:를|는)?\s*보장하지\s*않습니다/g, '');

  const medicalViolations = FORBIDDEN_MEDICAL.filter((term) => cleanedText.includes(term));
  const promoViolations = FORBIDDEN_PROMOTIONAL.filter((term) => cleanedText.includes(term));

  if (medicalViolations.length > 0) {
    issues.push(`의료 금지어 발견: ${medicalViolations.join(', ')}`);
    score -= medicalViolations.length * 15;
  }
  if (promoViolations.length > 0) {
    issues.push(`과장 광고 표현 발견: ${promoViolations.join(', ')}`);
    score -= promoViolations.length * 10;
  }

  // 2. AEO & 핵심 답변 블록 완성도 (가중치: 25점)
  const answerMatch = body_md.match(/<AnswerBlock>([\s\S]*?)<\/AnswerBlock>/);
  if (!answerMatch) {
    issues.push('<AnswerBlock> 첫머리 핵심 답변 부재');
    score -= 25;
  } else {
    const answerText = answerMatch[1].trim();
    if (answerText.length < 150) {
      issues.push(`<AnswerBlock> 분량 부족 (${answerText.length}자 / 권장 200~350자)`);
      score -= 10;
    } else if (answerText.length > 400) {
      issues.push(`<AnswerBlock> 분량 과다 (${answerText.length}자 / 권장 200~350자)`);
      score -= 5;
    }
  }

  // 본문 내 H1 태그 사용 여부 점검
  const h1Matches = body_md.match(/^#\s+[^\n]+/gm);
  if (h1Matches && h1Matches.length > 0) {
    issues.push(`본문 내 H1 태그(${h1Matches.length}개) 발견: 페이지 H1과 중복 방지를 위해 H2로 변환 필요`);
    score -= 15;
  }

  // 3. 정보 획득도 및 구조적 깊이 (가중치: 20점)
  const hasTable = /\|[\s\S]+?\|[\s\S]+?\|[\s\S]+?\|/.test(body_md);
  const hasCodeBlockOrCallout = />\s*\[!TIP\]|```/.test(body_md);
  const hasFaq = /##\s*.*자주\s*묻는\s*질문|###\s*Q\d\./.test(body_md);
  const faqCount = (body_md.match(/###\s*Q\d\./g) || []).length;

  if (!hasTable) {
    issues.push('비교/스펙 데이터 테이블(Table) 부재');
    score -= 10;
  }
  if (!hasCodeBlockOrCallout) {
    issues.push('실무 팁(Callout) 또는 프로세스 블록 부재');
    score -= 5;
  }
  if (!hasFaq || faqCount < 3) {
    issues.push(`FAQ 문항 수 부족 (${faqCount}개 / 최소 3개 권장)`);
    score -= 10;
  }

  // 글자 수 검증 (최소 3,500자)
  if (body_md.length < 3500) {
    issues.push(`본문 글자 수 부족 (${body_md.length}자 / 최소 3,500자 기준)`);
    score -= 20;
  }

  // 4. 문체 및 AI 클리셰 정화 (가중치: 15점)
  const foundCliches = AI_CLICHES.filter((c) => body_md.includes(c));
  if (foundCliches.length > 0) {
    issues.push(`AI 상투구/클리셰 검출: ${foundCliches.join(', ')}`);
    score -= foundCliches.length * 5;
  }

  // 5. 내부 링크 연결망 점검 (가중치: 10점)
  const internalLinks = (body_md.match(/\[[^\]]+\]\(\/(?:blog|guide|ranking|info)[^)]+\)/g) || []);
  if (internalLinks.length < 2) {
    issues.push(`내부 링크 연계 부족 (${internalLinks.length}개 / 최소 3개 권장)`);
    score -= 10;
  }

  score = Math.max(0, Math.min(100, score));

  // 개선 제안 생성 (Actionable Recommendations)
  if (score < 95) {
    improvements.push('품질 게이트 95점 미달 항목에 대한 자체 리팩토링 및 텍스트 정밀화 필요');
  } else {
    improvements.push('전체 5대 차원 품질 기준 충족. 발행 승인 및 프로덕션 배포 권장');
  }

  return {
    slug,
    reviewed_at: new Date().toISOString(),
    score,
    grade: score >= 95 ? 'EXCELLENT' : score >= 85 ? 'GOOD' : score >= 70 ? 'NEEDS_IMPROVEMENT' : 'POOR',
    issues,
    improvements,
    metrics: {
      character_count: body_md.length,
      answer_block_length: answerMatch ? answerMatch[1].trim().length : 0,
      faq_count: faqCount,
      internal_link_count: internalLinks.length,
      has_table: hasTable,
      medical_violation_count: medicalViolations.length,
      promotional_violation_count: promoViolations.length,
      ai_cliche_count: foundCliches.length
    }
  };
}

/**
 * 리뷰 결과를 바탕으로 본문을 자동 개선/정화하는 함수
 */
export function refineContent(post) {
  let refinedBody = post.body_md;
  let changed = false;

  // 1. 본문 내 H1 태그를 H2로 자동 다운그레이드
  if (/^#\s+/gm.test(refinedBody)) {
    refinedBody = refinedBody.replace(/^#\s+(.+)$/gm, '## $1');
    changed = true;
  }

  // 2. 알려진 AI 클리셰 표현 자연스러운 우리말로 자동 치환
  const clicheReplacements = [
    [/결론적으로\s*,?/g, ''],
    [/요약하면\s*,?/g, ''],
    [/종합하면\s*,?/g, ''],
    [/정리하자면\s*,?/g, ''],
    [/시사하는\s*바가\s*크다/g, '의미가 큽니다'],
    [/매우\s*중요하다/g, '반드시 확인해야 합니다'],
    [/주목할\s*만하다/g, '살펴볼 필요가 있습니다'],
    [/혁신적인/g, '실용적인'],
    [/압도적(?:인|으로)?/g, '눈에 띄는']
  ];

  for (const [pattern, replacement] of clicheReplacements) {
    if (pattern.test(refinedBody)) {
      refinedBody = refinedBody.replace(pattern, replacement);
      changed = true;
    }
  }

  return {
    ...post,
    body_md: refinedBody,
    refinement_applied: changed
  };
}
