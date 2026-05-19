import React from 'react'

interface PricingTableProps {
  priceMin?: number | null
  priceMax?: number | null
  subscriptionMonthly?: number | null
  rentalAvailable: boolean
  manufacturerUrl?: string | null
}

function formatPrice(amount: number): string {
  if (amount >= 10000) {
    const uck = Math.floor(amount / 10000)
    const remainder = amount % 10000
    return remainder > 0
      ? `${uck.toLocaleString()}만 ${remainder.toLocaleString()}원`
      : `${uck.toLocaleString()}만원`
  }
  return `${amount.toLocaleString()}원`
}

interface PricingRow {
  type: string
  value: string
  note: string
  highlighted: boolean
}

export default function PricingTable({
  priceMin,
  priceMax,
  subscriptionMonthly,
  rentalAvailable,
  manufacturerUrl,
}: PricingTableProps) {
  const rows: PricingRow[] = []

  if (priceMin || priceMax) {
    const value =
      priceMin && priceMax
        ? `${formatPrice(priceMin)} ~ ${formatPrice(priceMax)}`
        : priceMin
        ? `${formatPrice(priceMin)} ~`
        : priceMax
        ? `~ ${formatPrice(priceMax)}`
        : '-'
    rows.push({
      type: '구매 (일시불)',
      value,
      note: '제조사 또는 공식 대리점 구매',
      highlighted: false,
    })
  }

  if (subscriptionMonthly) {
    rows.push({
      type: '월정액 구독',
      value: `${formatPrice(subscriptionMonthly)}/월`,
      note: '계약 기간에 따라 상이할 수 있음',
      highlighted: true,
    })
  }

  if (rentalAvailable) {
    rows.push({
      type: '단기 대여',
      value: '지자체·복지관 문의',
      note: '지원사업 통해 무료 또는 저렴하게 이용 가능',
      highlighted: false,
    })
  }

  if (rows.length === 0) {
    return (
      <section aria-label="가격 정보">
        <h2 className="text-xl font-bold text-gray-900 mb-4">가격 정보</h2>
        <p className="text-sm text-gray-500">
          정확한 가격은 제조사 또는 판매처에 문의하시기 바랍니다.
        </p>
      </section>
    )
  }

  return (
    <section aria-label="가격 정보">
      <h2 className="text-xl font-bold text-gray-900 mb-4">가격 정보</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm border border-gray-200 rounded-xl overflow-hidden">
          <thead>
            <tr className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wide">
              <th className="text-left px-5 py-3 font-semibold w-1/4">구매 유형</th>
              <th className="text-left px-5 py-3 font-semibold w-1/4">가격</th>
              <th className="text-left px-5 py-3 font-semibold">비고</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((row, index) => (
              <tr
                key={index}
                className={row.highlighted ? 'bg-blue-50' : 'bg-white hover:bg-gray-50'}
              >
                <td className="px-5 py-3 font-medium text-gray-900">{row.type}</td>
                <td className="px-5 py-3 font-bold text-gray-900">{row.value}</td>
                <td className="px-5 py-3 text-gray-500">{row.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {manufacturerUrl && (
        <p className="mt-3 text-xs text-gray-500">
          최신 가격은{' '}
          <a
            href={manufacturerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            제조사 공식 사이트
          </a>
          에서 확인하시기 바랍니다.
        </p>
      )}
    </section>
  )
}
