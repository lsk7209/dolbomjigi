'use client';

import Link from 'next/link';
import { useState } from 'react';

// ─────────────────────────────────────────
// 네비게이션 메뉴 구성
// ─────────────────────────────────────────

interface NavItem {
  label: string;
  href: string;
}

const NAV_ITEMS: NavItem[] = [
  { label: '제품', href: '/robot' },
  { label: '비교', href: '/compare' },
  { label: '가이드', href: '/guide' },
  { label: '지원사업', href: '/support' },
  { label: '정보', href: '/info' },
  { label: '블로그', href: '/blog' },
];

// ─────────────────────────────────────────
// 컴포넌트
// ─────────────────────────────────────────

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-100 bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* 로고 */}
        <Link
          href="/"
          className="flex items-center gap-2 text-xl font-bold text-indigo-700 hover:text-indigo-800 transition-colors"
          aria-label="돌봄지기 홈으로 이동"
        >
          <span className="text-2xl" aria-hidden="true">🤖</span>
          <span>돌봄지기</span>
        </Link>

        {/* 데스크탑 네비게이션 */}
        <nav className="hidden md:flex items-center gap-1" aria-label="주 메뉴">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* 모바일 햄버거 버튼 */}
        <button
          type="button"
          className="md:hidden inline-flex items-center justify-center rounded-md p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
          aria-label={menuOpen ? '메뉴 닫기' : '메뉴 열기'}
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
          onClick={() => setMenuOpen((prev) => !prev)}
        >
          <span className="sr-only">{menuOpen ? '닫기' : '메뉴'}</span>
          {menuOpen ? (
            /* X 아이콘 */
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            /* 햄버거 아이콘 */
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          )}
        </button>
      </div>

      {/* 모바일 메뉴 */}
      {menuOpen && (
        <div
          id="mobile-menu"
          className="md:hidden border-t border-gray-100 bg-white"
          role="navigation"
          aria-label="모바일 메뉴"
        >
          <div className="space-y-1 px-4 pb-4 pt-2">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block rounded-md px-3 py-2 text-base font-medium text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
                onClick={() => setMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
