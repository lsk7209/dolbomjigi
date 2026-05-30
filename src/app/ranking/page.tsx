import type { Metadata } from 'next'
import Link from 'next/link'
import { SITE_URL } from '@/lib/config'

export const metadata: Metadata = {
  title: '돌봄 로봇 순위 — 카테고리별 랭킹 | 돌봄지기',
  description:
    '가성비, 어르신 친화, 정부 지원, 반려·재활·모니터링 등 7개 카테고리별 돌봄 로봇 순위를 확인하세요.',
  openGraph: {
    title: '돌봄 로봇 순위 — 카테고리별 랭킹 | 돌봄지기',
    description: '7개 카테고리별 돌봄 로봇 순위',
    url: `${SITE_URL}/ranking`,
    type: 'website',
    siteName: '돌봄지기',
  },
  alternates: { canonical: `${SITE_URL}/ranking` },
}

const CATEGORIES = [
  {
    slug: 'best-value',
    label: '가성비 최고',
    description: '가격 대비 기능이 뛰어난 제품 순위',
    color: 'bg-yellow-100 text-yellow-800',
  },
  {
    slug: 'senior-friendly',
    label: '어르신 친화',
    description: '독거 어르신·시니어 사용자에게 적합한 로봇',
    color: 'bg-blue-100 text-blue-800',
  },
  {
    slug: 'government-supported',
    label: '정부·지자체 지원',
    description: '보조금·무상 보급 지원사업 대상 로봇',
    color: 'bg-green-100 text-green-800',
  },
  {
    slug: 'companion',
    label: '반려·동행 로봇',
    description: '대화·감정 교류 중심의 반려형 로봇',
    color: 'bg-purple-100 text-purple-800',
  },
  {
    slug: 'senior-care',
    label: '노인돌봄 로봇',
    description: '일상 돌봄·건강 모니터링 전문 로봇',
    color: 'bg-orange-100 text-orange-800',
  },
  {
    slug: 'rehabilitation',
    label: '재활 로봇',
    description: '뇌졸중·보행 훈련 재활의학 로봇',
    color: 'bg-teal-100 text-teal-800',
  },
  {
    slug: 'monitoring',
    label: '모니터링 로봇',
    description: '낙상 감지·원격 모니터링 안전 로봇',
    color: 'bg-red-100 text-red-800',
  },
]

export default function RankingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <section className="bg-white border-b border-gray-200">
        <div className="mx-auto max-w-4xl px-4 py-10">
          <p className="text-sm text-blue-600 font-medium mb-1">돌봄지기 &rsaquo; 랭킹</p>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            돌봄 로봇 순위
          </h1>
          <p className="text-gray-600 text-sm leading-relaxed max-w-2xl">
            어르신 돌봄로봇을 가성비, 사용 편의성, 정부 지원 여부 등 다양한 기준으로 순위를 정리했습니다.
            상황에 맞는 카테고리를 선택하세요.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-4xl px-4 py-8 w-full flex flex-col gap-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.slug}
              href={`/ranking/${cat.slug}`}
              className="flex flex-col gap-2 border border-gray-200 rounded-xl bg-white hover:shadow-md hover:border-blue-200 transition-all px-5 py-4"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-base font-semibold text-gray-900">{cat.label}</span>
                <span
                  className={`inline-flex items-center shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${cat.color}`}
                >
                  순위
                </span>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">{cat.description}</p>
              <span className="text-xs text-blue-600 mt-1">순위 보기 &rarr;</span>
            </Link>
          ))}
        </div>

        <div className="border border-gray-200 rounded-xl bg-white px-5 py-5 text-sm text-gray-600 leading-relaxed">
          <p className="font-semibold text-gray-800 mb-1">순위 산정 기준 안내</p>
          <p>
            순위는 가격, 국내 판매 여부, 렌탈 가능 여부, 카테고리 적합성 등을 기준으로 산정됩니다.
            실제 구매·도입 시에는 기관 또는 가정 환경에 맞게 전문가 상담을 권장합니다.
          </p>
        </div>

        <footer className="flex flex-wrap justify-center gap-4 text-sm text-gray-500 border-t border-gray-200 pt-6">
          <Link href="/" className="hover:text-gray-800">홈</Link>
          <Link href="/robot" className="hover:text-gray-800">제품 목록</Link>
          <Link href="/compare" className="hover:text-gray-800">제품 비교</Link>
          <Link href="/support" className="hover:text-gray-800">지원사업</Link>
        </footer>
      </div>
    </div>
  )
}
