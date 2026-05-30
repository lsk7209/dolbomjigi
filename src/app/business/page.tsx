import type { Metadata } from 'next'
import Link from 'next/link'
import { SITE_URL } from '@/lib/config'

export const metadata: Metadata = {
  title: '기관·시설 돌봄로봇 도입 가이드 | 돌봄지기',
  description:
    '요양원, 복지관 등 기관·시설에서 돌봄로봇을 도입하는 절차, 비용 추정, 지원사업 정보를 안내합니다.',
  openGraph: {
    title: '기관·시설 돌봄로봇 도입 가이드 | 돌봄지기',
    description: '요양원·복지관 등 기관용 돌봄로봇 도입 가이드',
    url: `${SITE_URL}/business`,
    type: 'website',
    siteName: '돌봄지기',
  },
  alternates: { canonical: `${SITE_URL}/business` },
}

const BUSINESS_TYPES = [
  {
    slug: 'nursing-home',
    name: '요양원',
    badge: '장기요양',
    description:
      '24시간 돌봄이 필요한 어르신을 위한 장기요양 기관의 돌봄로봇 도입 절차와 지원사업을 안내합니다.',
    color: 'bg-teal-100 text-teal-800',
  },
  {
    slug: 'welfare-center',
    name: '복지관',
    badge: '사회복지',
    description:
      '지역 어르신 여가·건강·정서 지원을 담당하는 사회복지 시설의 돌봄로봇 활용 방안을 안내합니다.',
    color: 'bg-blue-100 text-blue-800',
  },
]

export default function BusinessPage() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <section className="bg-white border-b border-gray-200">
        <div className="mx-auto max-w-4xl px-4 py-10">
          <p className="text-sm text-teal-600 font-medium mb-1">돌봄지기 &rsaquo; B2B 도입 가이드</p>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            기관·시설 돌봄로봇 도입 가이드
          </h1>
          <p className="text-gray-600 text-sm leading-relaxed max-w-2xl">
            요양원, 복지관 등 돌봄 기관을 위한 돌봄로봇 도입 가이드입니다.
            절차, 비용 추정, 활용 가능한 지원사업을 안내합니다.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-4xl px-4 py-8 w-full flex flex-col gap-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {BUSINESS_TYPES.map((biz) => (
            <Link
              key={biz.slug}
              href={`/business/${biz.slug}`}
              className="flex flex-col gap-3 border border-gray-200 rounded-xl bg-white hover:shadow-md hover:border-teal-200 transition-all px-5 py-5"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-base font-semibold text-gray-900">{biz.name}</span>
                <span
                  className={`inline-flex items-center shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${biz.color}`}
                >
                  {biz.badge}
                </span>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">{biz.description}</p>
              <span className="text-xs text-teal-600 mt-auto">도입 가이드 보기 &rarr;</span>
            </Link>
          ))}
        </div>

        <div className="border border-gray-200 rounded-xl bg-white px-5 py-5 text-sm text-gray-600 leading-relaxed">
          <p className="font-semibold text-gray-800 mb-1">기관 도입 문의</p>
          <p>
            지원사업 신청이나 제품 선정에 대해 궁금한 점은 보건복지부 노인정책과 또는
            관할 지자체 노인복지 담당 부서에 문의하세요.
          </p>
          <div className="mt-3 flex flex-wrap gap-3">
            <a
              href="https://www.bokjiro.go.kr"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline text-sm"
            >
              복지로 바로가기 &rarr;
            </a>
            <Link href="/support" className="text-blue-600 hover:underline text-sm">
              지원사업 목록 보기 &rarr;
            </Link>
          </div>
        </div>

        <footer className="flex flex-wrap justify-center gap-4 text-sm text-gray-500 border-t border-gray-200 pt-6">
          <Link href="/" className="hover:text-gray-800">홈</Link>
          <Link href="/support" className="hover:text-gray-800">지원사업</Link>
          <Link href="/robot" className="hover:text-gray-800">제품 목록</Link>
          <Link href="/guide" className="hover:text-gray-800">이용 가이드</Link>
        </footer>
      </div>
    </div>
  )
}
