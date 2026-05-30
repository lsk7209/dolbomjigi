import Link from 'next/link';

// ─────────────────────────────────────────
// 빠른 링크
// ─────────────────────────────────────────

interface FooterLink {
  label: string;
  href: string;
}

const QUICK_LINKS: FooterLink[] = [
  { label: '블로그', href: '/blog' },
  { label: '로봇 제품 목록', href: '/robot' },
  { label: '제품 비교', href: '/compare' },
  { label: '구매·렌탈 가이드', href: '/guide' },
  { label: '지원사업 안내', href: '/support' },
  { label: '최신 연구·뉴스', href: '/info' },
  { label: '연구 자료', href: '/research' },
];

const LEGAL_LINKS: FooterLink[] = [
  { label: '이용약관', href: '/terms' },
  { label: '개인정보처리방침', href: '/privacy' },
  { label: '사이트 소개', href: '/about' },
];

// ─────────────────────────────────────────
// 컴포넌트
// ─────────────────────────────────────────

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-gray-200 bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {/* 상단 영역 */}
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {/* 사이트 소개 */}
          <div>
            <p className="text-lg font-bold text-indigo-700">돌봄지기</p>
            <p className="mt-2 text-sm text-gray-500 leading-relaxed">
              노인·장애인 돌봄로봇, 재활로봇, 지원사업 정보를 한눈에.
              <br />
              효돌, 다솜, 보미 등 국내 돌봄로봇 종합 정보 사이트.
            </p>
          </div>

          {/* 빠른 링크 */}
          <div>
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
              빠른 링크
            </h2>
            <ul className="mt-3 space-y-2" role="list">
              {QUICK_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-gray-500 hover:text-indigo-600 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* 법적 링크 */}
          <div>
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
              정책
            </h2>
            <ul className="mt-3 space-y-2" role="list">
              {LEGAL_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-gray-500 hover:text-indigo-600 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* 면책 고지 */}
        <div className="mt-8 space-y-3 rounded-lg bg-gray-100 px-4 py-4 text-xs text-gray-500 leading-relaxed">
          {/* 의료 면책 */}
          <p>
            <strong className="font-medium text-gray-600">의료 정보 면책 고지:</strong>{' '}
            본 사이트는 의료적 조언을 제공하지 않습니다. 제품 및 서비스에 관한 정보는
            일반적인 참고 목적으로만 제공되며, 전문 의료인의 진단·처방·치료를 대체할 수 없습니다.
            건강 관련 결정은 반드시 의사, 간호사 등 전문 의료인과 상담하십시오.
          </p>
          {/* 광고 면책 */}
          <p>
            <strong className="font-medium text-gray-600">광고 고지:</strong>{' '}
            본 사이트는 Google AdSense 등 제3자 광고 서비스를 통해 광고 수익을 얻을 수 있습니다.
            광고 콘텐츠는 사이트 편집 방침과 독립적으로 운영되며, 특정 제품·서비스를 보증하지 않습니다.
          </p>
        </div>

        {/* 하단 카피라이트 */}
        <div className="mt-6 flex flex-col items-center justify-between gap-2 border-t border-gray-200 pt-6 sm:flex-row">
          <p className="text-xs text-gray-400">
            &copy; {currentYear} 돌봄지기(dolbomjigi.com). All rights reserved.
          </p>
          <p className="text-xs text-gray-400">
            공공 데이터 출처:{' '}
            <a
              href="https://www.bizinfo.go.kr"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-indigo-500 underline"
            >
              bizinfo.go.kr
            </a>
            {' '}(공공누리 제1유형)
          </p>
        </div>
      </div>
    </footer>
  );
}
