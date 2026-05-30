import type { Metadata } from 'next'
import { SITE_URL } from '@/lib/config'

export const metadata: Metadata = {
  title: '돌봄지기 소개 | 어르신 돌봄로봇 정보 플랫폼',
  description:
    '돌봄지기는 어르신 돌봄로봇 제품 정보, 지자체 지원사업, 기관 도입 가이드를 공공누리 데이터 기반으로 제공하는 정보 플랫폼입니다.',
  openGraph: {
    title: '돌봄지기 소개',
    description: '공공누리 데이터 기반 어르신 돌봄로봇 정보 플랫폼 돌봄지기를 소개합니다.',
    type: 'website',
  },
  alternates: {
    canonical: `${SITE_URL}/about`,
  },
}

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10 flex flex-col gap-8">
      {/* 브레드크럼 */}
      <nav className="text-xs text-gray-500" aria-label="breadcrumb">
        <ol className="flex items-center gap-1">
          <li><a href="/" className="hover:underline">홈</a></li>
          <li aria-hidden="true">/</li>
          <li className="text-gray-800 font-medium">사이트 소개</li>
        </ol>
      </nav>

      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-gray-900">돌봄지기 소개</h1>
        <p className="text-sm text-gray-600">
          어르신 돌봄로봇 정보·신청·도입을 돕는 전문 정보 플랫폼
        </p>
      </header>

      <section className="flex flex-col gap-6 text-sm text-gray-700 leading-relaxed">

        <div>
          <h2 className="text-base font-semibold text-gray-900 mb-2">돌봄지기란?</h2>
          <p>
            돌봄지기는 어르신과 가족 돌봄인, 사회복지 종사자, 지자체 담당자가 돌봄로봇과 관련된
            정확하고 신뢰할 수 있는 정보를 쉽게 찾을 수 있도록 만들어진 정보 플랫폼입니다.
          </p>
          <p className="mt-2">
            복잡한 지원사업 안내, 다양한 제품 비교, 기관 도입 절차 등 어르신 돌봄로봇과 관련된
            모든 정보를 한곳에서 제공합니다.
          </p>
        </div>

        <div>
          <h2 className="text-base font-semibold text-gray-900 mb-2">제공 정보</h2>
          <ul className="list-disc list-inside flex flex-col gap-1">
            <li>
              <strong>돌봄로봇 제품 정보</strong> — 말벗·돌봄보조·재활·모니터링 제품 비교 및 상세 안내
            </li>
            <li>
              <strong>지자체 지원사업</strong> — 전국 시도·시군구 무상 보급·렌탈·보조금 사업 목록
            </li>
            <li>
              <strong>국가 단위 사업</strong> — 보건복지부 등 중앙부처 지원 프로그램
            </li>
            <li>
              <strong>이용 가이드</strong> — 가족 돌봄인·사회복지사·공무원·기관 담당자별 맞춤 가이드
            </li>
            <li>
              <strong>기관 도입 가이드</strong> — 요양원·복지관 도입 절차, 비용·효과 추정
            </li>
            <li>
              <strong>학술 연구</strong> — 돌봄로봇 효과 관련 국내외 연구 인용 정리
            </li>
          </ul>
        </div>

        <div>
          <h2 className="text-base font-semibold text-gray-900 mb-2">데이터 신뢰성</h2>
          <p>
            모든 지원사업 정보는 공공누리 라이선스를 준수하여 수집·가공된 공공데이터를 기반으로 합니다.
            전문가 감수(human_reviewed)를 통과한 정보만 게시하며, 정기적으로 원문 출처를 확인합니다.
          </p>
          <p className="mt-2">
            의료·법률·세무 등 전문 분야의 판단이 필요한 사항은 반드시 해당 전문가 또는
            관할 기관에 직접 문의하시기 바랍니다.
          </p>
        </div>

        <div>
          <h2 className="text-base font-semibold text-gray-900 mb-2">콘텐츠 정책</h2>
          <ul className="list-disc list-inside flex flex-col gap-1">
            <li>의료 효과·치료 효능 주장 금지 (YMYL 정책 준수)</li>
            <li>과장 광고성 표현 사용 금지</li>
            <li>공공데이터 출처 명시 및 공공누리 라이선스 고지</li>
            <li>AI 생성 콘텐츠 표시 (해당 시)</li>
          </ul>
        </div>

        <div>
          <h2 className="text-base font-semibold text-gray-900 mb-2">문의</h2>
          <p>
            정보 오류 신고, 지원사업 제보, 협력 문의는{' '}
            <a
              href="mailto:info@dolbomjigi.com"
              className="text-blue-600 hover:underline"
            >
              info@dolbomjigi.com
            </a>
            으로 연락해 주세요.
          </p>
        </div>

      </section>

      {/* 하단 링크 */}
      <nav className="flex flex-wrap gap-4 text-sm text-gray-500 border-t border-gray-200 pt-4">
        <a href="/privacy" className="hover:text-gray-800">개인정보처리방침</a>
        <a href="/terms" className="hover:text-gray-800">이용약관</a>
      </nav>
    </main>
  )
}
