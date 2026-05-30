import type { Metadata } from 'next'
import { SITE_URL } from '@/lib/config'

export const metadata: Metadata = {
  title: '개인정보처리방침 | 돌봄지기',
  description: '돌봄지기 개인정보처리방침 — 수집 항목, 이용 목적, 보유 기간, 제3자 제공 여부 등을 안내합니다.',
  alternates: {
    canonical: `${SITE_URL}/privacy`,
  },
}

const UPDATED_DATE = '2026-05-19'

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10 flex flex-col gap-6">
      {/* 브레드크럼 */}
      <nav className="text-xs text-gray-500" aria-label="breadcrumb">
        <ol className="flex items-center gap-1">
          <li><a href="/" className="hover:underline">홈</a></li>
          <li aria-hidden="true">/</li>
          <li className="text-gray-800 font-medium">개인정보처리방침</li>
        </ol>
      </nav>

      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-gray-900">개인정보처리방침</h1>
        <p className="text-xs text-gray-500">최종 수정일: {UPDATED_DATE}</p>
      </header>

      <article className="flex flex-col gap-6 text-sm text-gray-700 leading-relaxed">

        <p>
          돌봄지기(이하 &quot;사이트&quot;)는 「개인정보 보호법」 및 관련 법령을 준수하며,
          이용자의 개인정보를 안전하게 처리하기 위해 다음과 같이 개인정보처리방침을 수립합니다.
        </p>

        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-2">
            제1조 (개인정보의 처리 목적)
          </h2>
          <p>
            사이트는 현재 회원 가입, 로그인 등 별도의 개인정보 수집 서비스를 운영하지 않습니다.
            다만, 문의 메일 수신 시 이메일 주소 및 문의 내용을 처리 목적에 한해서만 활용하고,
            처리 완료 후 지체 없이 파기합니다.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-2">
            제2조 (수집하는 개인정보 항목)
          </h2>
          <ul className="list-disc list-inside flex flex-col gap-1">
            <li>자동 수집 정보: 접속 IP, 브라우저 종류, 방문 일시, 서비스 이용 기록 (서버 로그)</li>
            <li>문의 시: 이메일 주소, 문의 내용</li>
          </ul>
          <p className="mt-2 text-gray-500">
            사이트는 별도의 계정 시스템이 없어 민감정보를 수집하지 않습니다.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-2">
            제3조 (개인정보의 보유 및 이용 기간)
          </h2>
          <ul className="list-disc list-inside flex flex-col gap-1">
            <li>서버 로그: 최대 90일 보관 후 자동 삭제</li>
            <li>문의 이메일: 처리 완료 후 즉시 삭제</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-2">
            제4조 (개인정보의 제3자 제공)
          </h2>
          <p>
            사이트는 이용자의 개인정보를 제3자에게 제공하지 않습니다.
            다만, 법률에 특별한 규정이 있거나 법령상 의무를 준수하기 위해 불가피한 경우는 예외로 합니다.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-2">
            제5조 (쿠키 및 분석 도구)
          </h2>
          <p>
            사이트는 서비스 개선을 위해 Google Analytics 4(GA4) 및 Google Search Console을
            이용할 수 있습니다. 이 과정에서 쿠키 또는 유사 기술이 사용될 수 있으며,
            브라우저 설정을 통해 쿠키 수신을 거부할 수 있습니다.
          </p>
          <p className="mt-2">
            Google 의 개인정보 처리 방침은{' '}
            <a
              href="https://policies.google.com/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              policies.google.com/privacy
            </a>
            에서 확인할 수 있습니다.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-2">
            제6조 (개인정보 보호책임자)
          </h2>
          <dl className="flex flex-col gap-1">
            <div className="flex gap-2">
              <dt className="font-medium text-gray-600 w-24 shrink-0">담당자</dt>
              <dd>돌봄지기 운영팀</dd>
            </div>
            <div className="flex gap-2">
              <dt className="font-medium text-gray-600 w-24 shrink-0">이메일</dt>
              <dd>
                <a href="mailto:privacy@dolbomjigi.com" className="text-blue-600 hover:underline">
                  privacy@dolbomjigi.com
                </a>
              </dd>
            </div>
          </dl>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-2">
            제7조 (이용자의 권리)
          </h2>
          <p>
            이용자는 개인정보 열람, 정정, 삭제, 처리 정지를 요청할 권리가 있습니다.
            요청 사항은 제6조의 이메일로 연락해 주시면 지체 없이 처리합니다.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-2">
            제8조 (개인정보처리방침의 변경)
          </h2>
          <p>
            이 방침은 법령 변경 또는 서비스 변화에 따라 수정될 수 있습니다.
            변경 시 사이트 공지 또는 이 페이지를 통해 안내합니다.
          </p>
          <p className="mt-1 text-gray-500">
            시행일: {UPDATED_DATE}
          </p>
        </section>

      </article>

      <nav className="flex flex-wrap gap-4 text-sm text-gray-500 border-t border-gray-200 pt-4">
        <a href="/terms" className="hover:text-gray-800">이용약관</a>
        <a href="/about" className="hover:text-gray-800">사이트 소개</a>
      </nav>
    </main>
  )
}
