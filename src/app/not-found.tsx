import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '페이지를 찾을 수 없습니다 | 돌봄지기',
  description: '요청하신 페이지가 존재하지 않거나 주소가 변경되었습니다.',
};

export default function NotFound() {
  return (
    <main className="min-h-[70vh] flex items-center justify-center px-4 py-16 bg-gray-50">
      <div className="mx-auto max-w-lg text-center flex flex-col items-center gap-6 bg-white p-8 sm:p-10 rounded-2xl border border-gray-200 shadow-sm">
        <span className="text-6xl" aria-hidden="true">🤖</span>
        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">404 Not Found</p>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            페이지를 찾을 수 없습니다
          </h1>
          <p className="text-sm text-gray-600 leading-relaxed mt-1">
            요청하신 주소의 정보가 이동되었거나 삭제되었을 수 있습니다.<br />
            입력하신 주소가 정확한지 다시 한번 확인해 주세요.
          </p>
        </div>

        <div className="w-full border-t border-gray-100 pt-6 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-xl bg-indigo-600 text-white px-5 py-2.5 text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            홈으로 이동
          </Link>
          <Link
            href="/robot"
            className="inline-flex items-center justify-center rounded-xl border border-gray-300 bg-white text-gray-700 px-5 py-2.5 text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            제품 목록 보기
          </Link>
          <Link
            href="/support"
            className="inline-flex items-center justify-center rounded-xl border border-gray-300 bg-white text-gray-700 px-5 py-2.5 text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            지원사업 찾기
          </Link>
        </div>
      </div>
    </main>
  );
}
