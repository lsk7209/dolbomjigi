import React from 'react'
import Link from 'next/link'

interface RegionalEntry {
  regionSlug: string
  sidoName: string
  sigunguName?: string | null
  distributionCount?: number | null
}

interface RegionalAvailabilityProps {
  entries: RegionalEntry[]
}

export default function RegionalAvailability({ entries }: RegionalAvailabilityProps) {
  if (entries.length === 0) {
    return (
      <section aria-label="지자체 보급 현황">
        <h2 className="text-xl font-bold text-gray-900 mb-4">지자체 보급 현황</h2>
        <p className="text-sm text-gray-500">
          현재 확인된 지자체 보급 정보가 없습니다.{' '}
          <Link href="/support/" className="text-blue-600 hover:underline">
            지원사업 전체 목록
          </Link>
          을 확인하세요.
        </p>
      </section>
    )
  }

  return (
    <section aria-label="지자체 보급 현황">
      <h2 className="text-xl font-bold text-gray-900 mb-2">지자체 보급 현황</h2>
      <p className="text-sm text-gray-500 mb-4">
        아래 지역에서 지자체 지원사업을 통해 보급되고 있습니다.{' '}
        <Link href="/support/" className="text-blue-600 hover:underline">
          지원사업 상세 보기 →
        </Link>
      </p>
      <ul className="flex flex-wrap gap-2">
        {entries.map((entry, index) => {
          const regionName = entry.sigunguName
            ? `${entry.sidoName} ${entry.sigunguName}`
            : entry.sidoName
          return (
            <li key={index}>
              <Link
                href={`/support/?region=${entry.regionSlug}`}
                className="inline-flex items-center gap-1.5 bg-white border border-gray-200 rounded-full px-3 py-1.5 text-xs text-gray-700 hover:border-blue-400 hover:text-blue-700 transition-colors"
              >
                <span className="text-gray-400">📍</span>
                <span>{regionName}</span>
                {entry.distributionCount && (
                  <span className="bg-blue-100 text-blue-700 rounded-full px-1.5 py-0.5 text-xs font-semibold">
                    {entry.distributionCount.toLocaleString()}대
                  </span>
                )}
              </Link>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
