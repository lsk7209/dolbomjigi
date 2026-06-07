import type { Metadata } from 'next';
import Link from 'next/link';
import { SITE_URL } from '@/lib/config';

export const metadata: Metadata = {
  title: '문의하기 | 돌봄지기',
  description:
    '돌봄지기 정보 오류 제보, 공공데이터 정정 요청, 광고 및 제휴 문의, 개인정보 관련 요청을 안내합니다.',
  alternates: {
    canonical: `${SITE_URL}/contact`,
  },
  openGraph: {
    title: '문의하기 | 돌봄지기',
    description: '돌봄지기 운영 관련 문의와 정보 정정 요청 안내 페이지입니다.',
    type: 'website',
  },
};

export default function ContactPage() {
  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-10">
      <nav className="text-xs text-gray-500" aria-label="breadcrumb">
        <ol className="flex items-center gap-1">
          <li>
            <Link href="/" className="hover:underline">
              홈
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li className="font-medium text-gray-800">문의하기</li>
        </ol>
      </nav>

      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-gray-900">문의하기</h1>
        <p className="text-sm leading-relaxed text-gray-600">
          돌봄지기는 돌봄로봇, 고령자 돌봄, 지자체 지원사업 정보를 공공데이터와 자체 검수 기준으로
          정리합니다. 정보 정정, 출처 보강, 운영 관련 문의는 아래 연락처로 보내 주세요.
        </p>
      </header>

      <section className="flex flex-col gap-6 text-sm leading-relaxed text-gray-700">
        <div>
          <h2 className="mb-2 text-base font-semibold text-gray-900">문의 가능 항목</h2>
          <ul className="flex list-inside list-disc flex-col gap-1">
            <li>돌봄로봇 제품 정보, 지원사업, 기관 정보의 오류 제보</li>
            <li>공공데이터 출처, 업데이트 날짜, 인용 정보 정정 요청</li>
            <li>광고 게재, 제휴, 자료 제공 관련 문의</li>
            <li>개인정보 열람, 정정, 삭제 요청</li>
          </ul>
        </div>

        <div>
          <h2 className="mb-2 text-base font-semibold text-gray-900">연락처</h2>
          <p>
            이메일:{' '}
            <a href="mailto:info@dolbomjigi.com" className="text-blue-600 hover:underline">
              info@dolbomjigi.com
            </a>
          </p>
          <p className="mt-2">
            문의 시 페이지 주소, 확인한 날짜, 정정이 필요한 내용을 함께 적어 주시면 검토가 빠릅니다.
          </p>
        </div>

        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-xs text-gray-600">
          돌봄지기는 의료 진단, 치료, 처방, 법률 자문을 제공하지 않습니다. 건강 상태나 돌봄 서비스
          선택과 관련된 결정은 의사, 간호사, 사회복지사, 지자체 담당 부서 등 관련 전문가에게 직접
          상담해 주세요.
        </div>
      </section>

      <nav className="flex flex-wrap gap-4 border-t border-gray-200 pt-4 text-sm text-gray-500">
        <a href="/about" className="hover:text-gray-800">
          사이트 소개
        </a>
        <a href="/privacy" className="hover:text-gray-800">
          개인정보처리방침
        </a>
        <a href="/terms" className="hover:text-gray-800">
          이용약관
        </a>
      </nav>
    </main>
  );
}
