'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // 런타임 오류 로깅
    console.error('Page runtime error:', error);
  }, [error]);

  return (
    <main className="min-h-[70vh] flex items-center justify-center px-4 py-16 bg-gray-50">
      <div className="mx-auto max-w-lg text-center flex flex-col items-center gap-6 bg-white p-8 sm:p-10 rounded-2xl border border-gray-200 shadow-sm">
        <span className="text-5xl" aria-hidden="true">⚠️</span>
        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold text-rose-600 uppercase tracking-wider">서비스 일시 오류</p>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            페이지를 불러오지 못했습니다
          </h1>
          <p className="text-sm text-gray-600 leading-relaxed mt-1">
            일시적인 통신 장애나 처리 오류가 발생했습니다.<br />
            잠시 후 다시 시도해 주시기 바랍니다.
          </p>
        </div>

        <div className="w-full border-t border-gray-100 pt-6 flex flex-col sm:flex-row gap-3 justify-center">
          <button
            type="button"
            onClick={() => reset()}
            className="inline-flex items-center justify-center rounded-xl bg-indigo-600 text-white px-5 py-2.5 text-sm font-medium hover:bg-indigo-700 transition-colors cursor-pointer"
          >
            다시 시도
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-xl border border-gray-300 bg-white text-gray-700 px-5 py-2.5 text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            홈으로 이동
          </Link>
        </div>
      </div>
    </main>
  );
}
