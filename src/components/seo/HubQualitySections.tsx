import Link from 'next/link'

type HubKey =
  | 'robot'
  | 'compare'
  | 'guide'
  | 'support'
  | 'info'
  | 'research'
  | 'ranking'
  | 'business'

type HubCopy = {
  title: string
  audience: string
  decision: string
  sourceFocus: string
  nextPath: string
  nextLabel: string
}

const HUB_COPY: Record<HubKey, HubCopy> = {
  robot: {
    title: '돌봄로봇 제품 목록',
    audience: '가족 보호자, 사회복지사, 요양기관 담당자',
    decision: '제품명보다 실제 생활 환경, 알림 방식, 설치 난이도, 월 유지비, 개인정보 처리 방식을 먼저 비교해야 합니다.',
    sourceFocus: '제조사 안내, 보건복지부 정책, 지자체 지원사업 공고, 제품 사용 설명서를 함께 확인합니다.',
    nextPath: '/compare',
    nextLabel: '제품 비교로 이동',
  },
  compare: {
    title: '돌봄로봇 비교',
    audience: '두세 개 후보 제품을 좁힌 사용자',
    decision: '가격표만 비교하지 말고 낙상 감지, 복약 알림, 영상 통화, 야간 모니터링, 가족 공유 기능을 같은 조건에서 확인해야 합니다.',
    sourceFocus: '공식 제품 설명, 지원사업 신청 조건, 설치 환경 안내, 개인정보 동의 범위를 같이 대조합니다.',
    nextPath: '/robot',
    nextLabel: '제품 목록으로 이동',
  },
  guide: {
    title: '돌봄로봇 선택 가이드',
    audience: '구매 전 체크리스트가 필요한 보호자와 현장 담당자',
    decision: '사용자의 인지 상태, 거주 형태, 보호자 방문 주기, 인터넷 환경, 응급 연락 체계가 맞지 않으면 좋은 제품도 오래 쓰기 어렵습니다.',
    sourceFocus: '복지서비스 신청 기준, 지자체 공고, 제품 설치 문서, 기관 내부 운영 지침을 함께 봅니다.',
    nextPath: '/support',
    nextLabel: '지원사업 확인',
  },
  support: {
    title: '돌봄로봇 지원사업',
    audience: '보조금, 무상 보급, 대여 사업을 확인하는 사용자',
    decision: '모집 기간, 대상 지역, 소득 기준, 기관 추천 여부, 본인 부담금, 사후 관리 조건을 같은 표에 놓고 확인해야 합니다.',
    sourceFocus: '복지로, 보건복지부, 지자체 고시 공고, 사업 수행기관 안내를 우선 출처로 삼습니다.',
    nextPath: '/guide',
    nextLabel: '신청 전 가이드',
  },
  info: {
    title: '돌봄로봇 정보',
    audience: '기술 용어와 정책 배경을 먼저 이해하려는 독자',
    decision: '센서, 음성 인식, 위치 알림, 생활 패턴 분석 같은 용어가 실제 돌봄 행동을 어떻게 바꾸는지 확인해야 합니다.',
    sourceFocus: '공공 정책 자료, 연구 기관 자료, 제조사 기술 설명, 개인정보 보호 안내를 구분해 읽습니다.',
    nextPath: '/research',
    nextLabel: '연구 자료 확인',
  },
  research: {
    title: '돌봄로봇 연구 자료',
    audience: '정책 담당자, 기관 운영자, 콘텐츠 검토자',
    decision: '논문의 표본, 기간, 대상자 특성, 측정 지표를 확인하지 않으면 효과를 과장해서 해석하기 쉽습니다.',
    sourceFocus: '학술 연구, 공공 연구보고서, 보건복지 정책 자료, 현장 적용 사례를 분리해 검토합니다.',
    nextPath: '/info',
    nextLabel: '기초 정보로 이동',
  },
  ranking: {
    title: '돌봄로봇 순위',
    audience: '짧은 시간 안에 후보군을 좁히려는 사용자',
    decision: '순위는 시작점일 뿐이며 가격, 지원 가능성, 설치 조건, 실제 돌봄 목적이 맞는지 다시 확인해야 합니다.',
    sourceFocus: '제품 정보, 지원사업 조건, 사용자 상황, 기관 도입 목적을 함께 보고 순위를 해석합니다.',
    nextPath: '/compare',
    nextLabel: '비교 기준 확인',
  },
  business: {
    title: '기관 돌봄로봇 도입',
    audience: '요양원, 복지관, 주간보호센터 운영자',
    decision: '구매 전에 운영 인력, 교육 시간, 개인정보 동의, 유지보수, 입소자 안전 기준을 내부 절차로 정리해야 합니다.',
    sourceFocus: '보건복지부 정책, 지자체 사업 공고, 조달 또는 제조사 계약 조건, 기관 개인정보 처리 기준을 함께 확인합니다.',
    nextPath: '/support',
    nextLabel: '지원사업 목록',
  },
}

const officialSources = [
  ['보건복지부', 'https://www.mohw.go.kr'],
  ['복지로', 'https://www.bokjiro.go.kr'],
  ['한국로봇산업진흥원', 'https://www.kiria.org'],
  ['공공데이터포털', 'https://www.data.go.kr'],
] as const

export default function HubQualitySections({ topic }: { topic: HubKey }) {
  const copy = HUB_COPY[topic]

  return (
    <section className="border border-gray-200 rounded-xl bg-white px-5 py-6 text-sm text-gray-700 leading-relaxed">
      <h2 className="text-lg font-bold text-gray-900 mb-3">{copy.title} 확인 기준</h2>
      <p className="mb-3">
        {copy.title} 페이지는 {copy.audience}가 빠르게 후보를 줄이도록 돕는 허브입니다. 단순한 링크 모음으로
        끝내지 않고, 실제 의사결정에서 먼저 확인해야 할 기준을 함께 제공합니다. {copy.decision} 특히 돌봄
        기술은 건강, 안전, 개인정보, 가족 소통이 한 번에 연결되므로 광고성 표현이나 단일 후기만으로 판단하면
        위험합니다.
      </p>
      <p className="mb-5">
        이 페이지를 볼 때는 현재 공개된 항목 수보다 판단 순서를 먼저 정하는 편이 안전합니다. 필요한 기능을
        정리하고, 거주 환경과 예산을 확인한 뒤, 지원사업 가능성과 사후 관리 조건을 따로 검토하세요. 같은
        돌봄로봇이라도 독거 어르신, 치매 초기 보호자, 요양기관, 복지관에서 요구하는 기능과 책임 범위가 다릅니다.
      </p>

      <h2 className="text-lg font-bold text-gray-900 mb-3">{copy.title} 공식 출처와 검증 순서</h2>
      <p className="mb-3">
        {copy.sourceFocus} 공공 제도와 제품 정보는 수시로 바뀔 수 있으므로 날짜, 지역, 신청 주체, 비용 부담,
        개인정보 동의 범위를 반드시 확인해야 합니다. 본문에서 제공하는 정보는 비교를 돕는 참고 자료이며,
        구매, 계약, 신청, 의료 판단을 대신하지 않습니다.
      </p>
      <ul className="grid gap-2 sm:grid-cols-2 mb-5">
        {officialSources.map(([label, href]) => (
          <li key={href} className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2">
            <a href={href} target="_blank" rel="noopener noreferrer" className="font-semibold text-blue-700 hover:underline">
              {label}
            </a>
            <span className="block text-xs text-gray-500 mt-1">정책, 제도, 공공 데이터 확인용 공식 참고 경로</span>
          </li>
        ))}
      </ul>

      <h2 className="text-lg font-bold text-gray-900 mb-3">{copy.title} 체크리스트</h2>
      <ul className="list-disc pl-5 space-y-2 mb-5">
        <li>대상자의 생활 패턴, 건강 상태, 보호자 연락 가능 시간을 먼저 적습니다.</li>
        <li>필수 기능과 있으면 좋은 기능을 나누고, 제품 설명이 실제 상황과 맞는지 확인합니다.</li>
        <li>초기 비용, 월 이용료, 렌탈, 설치비, 해지 조건을 같은 기준으로 비교합니다.</li>
        <li>카메라, 음성, 위치, 알림 데이터가 저장되는 방식과 동의 절차를 확인합니다.</li>
        <li>지원사업을 이용한다면 신청 기간, 지역 제한, 사후 보고 의무를 별도로 확인합니다.</li>
      </ul>

      <h2 className="text-lg font-bold text-gray-900 mb-3">{copy.title}의 한계와 다음 행동</h2>
      <p className="mb-4">
        이 허브는 후보를 좁히는 출발점입니다. 최종 결정 전에는 실제 제품 설명서, 공식 사업 공고, 기관 내부
        운영 규정, 가족 또는 담당자의 돌봄 계획을 함께 확인해야 합니다. 검색 결과에서 가장 눈에 띄는 제품이
        항상 최선은 아니며, 지원사업 대상 제품도 사용자의 집 구조와 돌봄 목표에 맞지 않을 수 있습니다.
      </p>
      <Link href={copy.nextPath} className="inline-flex items-center rounded-full bg-blue-600 text-white px-4 py-2 text-sm font-medium hover:bg-blue-700">
        {copy.nextLabel}
      </Link>
    </section>
  )
}
