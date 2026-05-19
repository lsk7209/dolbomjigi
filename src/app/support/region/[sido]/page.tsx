import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { db } from '@/db/client'
import { regions, supportPrograms } from '@/db/schema'
import { eq, and, isNull } from 'drizzle-orm'
import AnswerBlock from '@/components/common/AnswerBlock'
import UpdateNotice from '@/components/common/UpdateNotice'
import Sources from '@/components/common/Sources'
import JsonLdScript from '@/components/seo/JsonLdScript'
import {
  buildGovernmentServiceJsonLd,
  buildBreadcrumbJsonLd,
} from '@/lib/jsonld'

// ─────────────────────────────────────────
// 정적 경로 생성
// ─────────────────────────────────────────
export async function generateStaticParams() {
  try {
    const sidoRegions = await db
      .select({ slug: regions.slug })
      .from(regions)
      .where(eq(regions.level, 'sido'))
    return sidoRegions.map((r) => ({ sido: r.slug }))
  } catch {
    return []
  }
}

// ─────────────────────────────────────────
// 동적 메타데이터
// ─────────────────────────────────────────
export async function generateMetadata({
  params,
}: {
  params: Promise<{ sido: string }>
}): Promise<Metadata> {
  const { sido } = await params
  const region = await db
    .select()
    .from(regions)
    .where(and(eq(regions.slug, sido), eq(regions.level, 'sido')))
    .get()

  if (!region) return { title: '지역을 찾을 수 없습니다' }

  const title = `${region.sido_name} 돌봄로봇 보급사업 안내`
  const description = `${region.sido_name} 지역 어르신 돌봄로봇 지원사업 목록, 신청 방법, 대상자 안내. 공공누리 라이선스 준수 데이터.`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `https://dolbomjigi.com/support/region/${sido}`,
      type: 'website',
    },
    alternates: {
      canonical: `https://dolbomjigi.com/support/region/${sido}`,
    },
  }
}

// ─────────────────────────────────────────
// 지원사업 유형 한글 레이블
// ─────────────────────────────────────────
const PROGRAM_TYPE_LABEL: Record<string, string> = {
  free_distribution: '무상 보급',
  rental: '렌탈',
  subsidy: '보조금',
  rd_grant: 'R&D 지원',
}

const STATUS_LABEL: Record<string, string> = {
  active: '진행중',
  closed: '종료',
  unknown: '확인필요',
}

// ─────────────────────────────────────────
// 인근 시도 목록 (고정 데이터)
// ─────────────────────────────────────────
const NEIGHBOR_SIDOS: Record<string, string[]> = {
  seoul: ['gyeonggi', 'incheon'],
  busan: ['gyeongnam', 'ulsan'],
  daegu: ['gyeongbuk', 'gyeongnam'],
  incheon: ['seoul', 'gyeonggi'],
  gwangju: ['jeonnam', 'jeonbuk'],
  daejeon: ['chungnam', 'chungbuk', 'sejong'],
  ulsan: ['busan', 'gyeongnam'],
  sejong: ['daejeon', 'chungnam', 'chungbuk'],
  gyeonggi: ['seoul', 'incheon', 'chungnam', 'chungbuk', 'gangwon'],
  gangwon: ['gyeonggi', 'chungbuk', 'gyeongbuk'],
  chungbuk: ['gyeonggi', 'gangwon', 'chungnam', 'sejong', 'daejeon', 'gyeongbuk', 'jeonbuk'],
  chungnam: ['gyeonggi', 'chungbuk', 'sejong', 'daejeon', 'jeonbuk', 'jeonnam'],
  jeonbuk: ['chungnam', 'chungbuk', 'gyeongnam', 'jeonnam', 'gyeongbuk'],
  jeonnam: ['jeonbuk', 'chungnam', 'gwangju', 'gyeongnam'],
  gyeongbuk: ['gangwon', 'chungbuk', 'jeonbuk', 'gyeongnam', 'daegu', 'ulsan'],
  gyeongnam: ['jeonbuk', 'jeonnam', 'gyeongbuk', 'daegu', 'busan', 'ulsan'],
  jeju: [],
}

// ─────────────────────────────────────────
// 페이지 컴포넌트
// ─────────────────────────────────────────
export default async function SidoSupportPage({
  params,
}: {
  params: Promise<{ sido: string }>
}) {
  const { sido } = await params

  const region = await db
    .select()
    .from(regions)
    .where(and(eq(regions.slug, sido), eq(regions.level, 'sido')))
    .get()

  if (!region) notFound()

  // 해당 시도의 human_reviewed=true 프로그램만
  const programs = await db
    .select({
      id: supportPrograms.id,
      slug: supportPrograms.slug,
      name_ko: supportPrograms.name_ko,
      program_type: supportPrograms.program_type,
      status: supportPrograms.status,
      period_start: supportPrograms.period_start,
      period_end: supportPrograms.period_end,
      source_url: supportPrograms.source_url,
      source_license: supportPrograms.source_license,
      source_publication_date: supportPrograms.source_publication_date,
      application_url: supportPrograms.application_url,
      distribution_count: supportPrograms.distribution_count,
    })
    .from(supportPrograms)
    .where(
      and(
        eq(supportPrograms.region_id, region.id),
        eq(supportPrograms.human_reviewed, true),
      ),
    )

  // 인근 지자체 (sido 레벨)
  const neighborSlugs = NEIGHBOR_SIDOS[sido] ?? []
  const neighborRegions =
    neighborSlugs.length > 0
      ? await db
          .select({ slug: regions.slug, sido_name: regions.sido_name })
          .from(regions)
          .where(eq(regions.level, 'sido'))
      : []
  const neighbors = neighborRegions.filter((r) =>
    neighborSlugs.includes(r.slug),
  )

  const today = new Date().toISOString().slice(0, 10)
  const sourceUrl = programs[0]?.source_url ?? 'https://www.bokjiro.go.kr'

  const jsonLdData = [
    buildGovernmentServiceJsonLd({
      name: `${region.sido_name} 돌봄로봇 보급사업`,
      description: `${region.sido_name} 지역 어르신 돌봄로봇 지원사업 안내`,
      url: `https://dolbomjigi.com/support/region/${sido}`,
      areaServed: region.sido_name,
    }),
    buildBreadcrumbJsonLd([
      { name: '홈', url: 'https://dolbomjigi.com' },
      { name: '지원사업', url: 'https://dolbomjigi.com/support' },
      {
        name: region.sido_name,
        url: `https://dolbomjigi.com/support/region/${sido}`,
      },
    ]),
  ]

  return (
    <>
      <JsonLdScript data={jsonLdData} />

      <main className="mx-auto max-w-3xl px-4 py-10 flex flex-col gap-8">
        {/* 1. ProgramHero */}
        <header className="flex flex-col gap-2">
          <nav className="text-xs text-gray-500" aria-label="breadcrumb">
            <ol className="flex items-center gap-1">
              <li>
                <a href="/" className="hover:underline">
                  홈
                </a>
              </li>
              <li aria-hidden="true">/</li>
              <li>
                <a href="/support" className="hover:underline">
                  지원사업
                </a>
              </li>
              <li aria-hidden="true">/</li>
              <li className="text-gray-800 font-medium">{region.sido_name}</li>
            </ol>
          </nav>
          <h1 className="text-2xl font-bold text-gray-900">
            {region.sido_name} 돌봄로봇 보급사업 안내
          </h1>
          <p className="text-sm text-gray-600">
            {region.sido_name} 지역 어르신 돌봄로봇 지원사업 목록을 확인하세요.
            모든 정보는 공공누리 라이선스 준수 데이터입니다.
          </p>
        </header>

        {/* 2. AnswerBlock */}
        <AnswerBlock>
          {region.sido_name}은(는) 현재{' '}
          <strong>{programs.length}개</strong>의 검증된 돌봄로봇 보급사업을
          운영 중입니다. 사업 유형은 무상 보급·렌탈·보조금 등으로 구성되며,
          대상자 자격 및 신청 방법은 각 사업 상세 페이지에서 확인하실 수
          있습니다.
        </AnswerBlock>

        {/* 3. ProgramList */}
        <section aria-label="지원사업 목록">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">
            지원사업 목록
          </h2>

          {programs.length === 0 ? (
            <p className="text-sm text-gray-500 py-6 text-center border border-gray-200 rounded-lg">
              현재 검증된 지원사업 정보가 없습니다.
            </p>
          ) : (
            <ul className="flex flex-col divide-y divide-gray-200 border border-gray-200 rounded-lg overflow-hidden">
              {programs.map((prog) => (
                <li key={prog.id} className="bg-white hover:bg-gray-50">
                  <a
                    href={`/support/region/${sido}/${prog.slug}`}
                    className="flex flex-col gap-1 px-5 py-4"
                  >
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-gray-900">
                        {prog.name_ko}
                      </span>
                      <span className="inline-flex items-center rounded px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800">
                        {PROGRAM_TYPE_LABEL[prog.program_type] ??
                          prog.program_type}
                      </span>
                      <span
                        className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${
                          prog.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : prog.status === 'closed'
                              ? 'bg-gray-100 text-gray-600'
                              : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {STATUS_LABEL[prog.status] ?? prog.status}
                      </span>
                    </div>
                    {(prog.period_start || prog.period_end) && (
                      <p className="text-xs text-gray-500">
                        신청기간:{' '}
                        {prog.period_start
                          ? new Date(prog.period_start).toLocaleDateString(
                              'ko-KR',
                            )
                          : '미정'}{' '}
                        ~{' '}
                        {prog.period_end
                          ? new Date(prog.period_end).toLocaleDateString(
                              'ko-KR',
                            )
                          : '미정'}
                      </p>
                    )}
                    {prog.distribution_count && (
                      <p className="text-xs text-gray-500">
                        보급 대수: {prog.distribution_count.toLocaleString()}대
                      </p>
                    )}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* 4. UpdateNotice */}
        <UpdateNotice
          sourceUrl={sourceUrl}
          sourceName="복지로 / 지자체 공식 채널"
          license={programs[0]?.source_license ?? '공공누리 제1유형'}
          confirmedAt={today}
        />

        {/* 5. RelatedRegions */}
        {neighbors.length > 0 && (
          <section aria-label="인근 지자체 지원사업">
            <h2 className="text-base font-semibold text-gray-900 mb-2">
              인근 지자체 지원사업
            </h2>
            <ul className="flex flex-wrap gap-2">
              {neighbors.map((n) => (
                <li key={n.slug}>
                  <a
                    href={`/support/region/${n.slug}`}
                    className="inline-block rounded-full border border-gray-300 px-3 py-1 text-sm text-gray-700 hover:bg-gray-100 hover:border-gray-400"
                  >
                    {n.sido_name}
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* 6. Sources */}
        <Sources
          sources={[
            {
              type: 'government',
              label: '복지로 (보건복지부)',
              url: 'https://www.bokjiro.go.kr',
            },
            {
              type: 'government',
              label: `${region.sido_name}청 공식 홈페이지`,
              url: sourceUrl,
              license: programs[0]?.source_license ?? '공공누리 제1유형',
            },
          ]}
        />
      </main>
    </>
  )
}
