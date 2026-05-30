import type { Metadata } from 'next'
import { SITE_URL } from '@/lib/config'

export const metadata: Metadata = {
  title: '이용약관 | 돌봄지기',
  description: '돌봄지기 이용약관 — 서비스 이용 목적, 금지 행위, 면책 조항 등을 안내합니다.',
  alternates: {
    canonical: `${SITE_URL}/terms`,
  },
}

const UPDATED_DATE = '2026-05-19'

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10 flex flex-col gap-6">
      {/* 브레드크럼 */}
      <nav className="text-xs text-gray-500" aria-label="breadcrumb">
        <ol className="flex items-center gap-1">
          <li><a href="/" className="hover:underline">홈</a></li>
          <li aria-hidden="true">/</li>
          <li className="text-gray-800 font-medium">이용약관</li>
        </ol>
      </nav>

      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-gray-900">이용약관</h1>
        <p className="text-xs text-gray-500">최종 수정일: {UPDATED_DATE}</p>
      </header>

      <article className="flex flex-col gap-6 text-sm text-gray-700 leading-relaxed">

        <p>
          이 이용약관(이하 &quot;약관&quot;)은 돌봄지기(이하 &quot;사이트&quot;)가 제공하는
          모든 서비스의 이용 조건 및 절차, 사이트와 이용자의 권리·의무 관계를 규정합니다.
          사이트를 이용하면 이 약관에 동의한 것으로 간주합니다.
        </p>

        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-2">
            제1조 (목적)
          </h2>
          <p>
            이 약관은 돌봄지기가 제공하는 어르신 돌봄로봇 정보 서비스(이하 &quot;서비스&quot;)의
            이용과 관련하여 사이트와 이용자 간의 권리, 의무 및 책임 사항을 규정함을 목적으로 합니다.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-2">
            제2조 (정의)
          </h2>
          <ul className="list-disc list-inside flex flex-col gap-1">
            <li>
              <strong>서비스</strong>: 돌봄지기가 제공하는 돌봄로봇 제품 정보, 지원사업 안내,
              가이드, 연구 인용 등 모든 정보 제공 서비스
            </li>
            <li>
              <strong>이용자</strong>: 사이트에 접속하여 서비스를 이용하는 모든 사람
            </li>
            <li>
              <strong>콘텐츠</strong>: 사이트가 제공하는 텍스트, 이미지, 데이터 등 모든 정보
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-2">
            제3조 (서비스의 내용)
          </h2>
          <ul className="list-disc list-inside flex flex-col gap-1">
            <li>어르신 돌봄로봇 제품 정보 및 비교</li>
            <li>지자체·국가 단위 돌봄로봇 지원사업 안내</li>
            <li>이용 가이드 및 B2B 도입 가이드</li>
            <li>관련 학술 연구 인용 정보</li>
          </ul>
          <p className="mt-2">
            사이트는 서비스 내용을 사전 공지 없이 변경·중단·종료할 수 있습니다.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-2">
            제4조 (이용자의 의무)
          </h2>
          <p>이용자는 다음 행위를 해서는 안 됩니다.</p>
          <ul className="list-disc list-inside flex flex-col gap-1 mt-2">
            <li>허위 정보 유포 또는 사이트 콘텐츠의 무단 복제·배포·상업적 이용</li>
            <li>사이트 서버에 과부하를 주는 행위 (크롤링, 스크래핑 등 대량 자동 접근)</li>
            <li>타인의 개인정보를 침해하는 행위</li>
            <li>관련 법령을 위반하는 행위</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-2">
            제5조 (저작권 및 지적재산권)
          </h2>
          <p>
            사이트가 자체 제작한 콘텐츠(가이드, 분석, 편집 콘텐츠 등)의 저작권은
            돌봄지기 운영팀에 귀속됩니다.
          </p>
          <p className="mt-2">
            공공데이터 기반 정보는 해당 공공기관의 공공누리 라이선스 조건에 따릅니다.
            각 페이지의 출처 및 라이선스 안내를 확인하시기 바랍니다.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-2">
            제6조 (면책 조항)
          </h2>
          <ul className="list-disc list-inside flex flex-col gap-1">
            <li>
              사이트의 정보는 참고용이며, 의료·법률·세무 등 전문적인 판단을 대체하지 않습니다.
              전문가 상담을 권장합니다.
            </li>
            <li>
              지원사업 내용은 원문 출처를 기반으로 하나, 실제 내용과 다를 수 있습니다.
              반드시 해당 기관에 직접 확인하세요.
            </li>
            <li>
              사이트는 이용자가 서비스 이용 중 발생한 손해에 대해 사이트의 고의 또는
              중과실이 없는 한 책임을 지지 않습니다.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-2">
            제7조 (준거법 및 관할)
          </h2>
          <p>
            이 약관은 대한민국 법률에 따라 해석되며, 분쟁 발생 시 관할 법원은
            대한민국 민사소송법에 따른 법원으로 합니다.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-2">
            제8조 (약관의 변경)
          </h2>
          <p>
            사이트는 필요 시 약관을 변경할 수 있으며, 변경된 약관은 사이트 공지 또는
            이 페이지를 통해 고지합니다.
          </p>
          <p className="mt-1 text-gray-500">시행일: {UPDATED_DATE}</p>
        </section>

      </article>

      <nav className="flex flex-wrap gap-4 text-sm text-gray-500 border-t border-gray-200 pt-4">
        <a href="/privacy" className="hover:text-gray-800">개인정보처리방침</a>
        <a href="/about" className="hover:text-gray-800">사이트 소개</a>
      </nav>
    </main>
  )
}
