import React from 'react'
import Image from 'next/image'

const CATEGORY_LABEL: Record<string, string> = {
  companion: '반려·동행',
  senior_care: '노인돌봄',
  rehabilitation: '재활',
  monitoring: '모니터링',
}

const CATEGORY_COLOR: Record<string, string> = {
  companion: 'bg-green-100 text-green-800',
  senior_care: 'bg-blue-100 text-blue-800',
  rehabilitation: 'bg-orange-100 text-orange-800',
  monitoring: 'bg-purple-100 text-purple-800',
}

interface RobotHeroProps {
  nameKo: string
  nameEn?: string | null
  manufacturer: string
  category: string
  priceMin?: number | null
  priceMax?: number | null
  subscriptionMonthly?: number | null
  rentalAvailable: boolean
  heroImageUrl?: string | null
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

export default function RobotHero({
  nameKo,
  nameEn,
  manufacturer,
  category,
  priceMin,
  priceMax,
  subscriptionMonthly,
  rentalAvailable,
  heroImageUrl,
}: RobotHeroProps) {
  const categoryLabel = CATEGORY_LABEL[category] ?? category
  const categoryColor = CATEGORY_COLOR[category] ?? 'bg-gray-100 text-gray-800'

  return (
    <section className="bg-white border-b border-gray-100">
      <div className="max-w-5xl mx-auto px-4 py-10 flex flex-col gap-8 md:flex-row md:items-center md:gap-12">
        {/* 텍스트 영역 */}
        <div className="flex-1 flex flex-col gap-4">
          {/* 카테고리 뱃지 */}
          <div>
            <span
              className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${categoryColor}`}
            >
              {categoryLabel}
            </span>
          </div>

          {/* 제품명 */}
          <div>
            <h1 className="text-3xl font-bold text-gray-900 leading-tight">
              {nameKo}
            </h1>
            {nameEn && (
              <p className="text-lg text-gray-500 mt-1">{nameEn}</p>
            )}
          </div>

          {/* 제조사 */}
          <p className="text-sm text-gray-600">
            제조사: <span className="font-medium text-gray-800">{manufacturer}</span>
          </p>

          {/* 가격 요약 */}
          <div className="flex flex-wrap gap-3">
            {(priceMin || priceMax) && (
              <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-lg px-4 py-2">
                <span className="text-xs text-gray-500 font-medium">구매가</span>
                <span className="text-sm font-bold text-gray-900">
                  {priceMin && priceMax
                    ? `${formatPrice(priceMin)} ~ ${formatPrice(priceMax)}`
                    : priceMin
                    ? `${formatPrice(priceMin)}~`
                    : priceMax
                    ? `~${formatPrice(priceMax)}`
                    : ''}
                </span>
              </div>
            )}
            {subscriptionMonthly && (
              <div className="flex items-center gap-1.5 bg-blue-50 border border-blue-200 rounded-lg px-4 py-2">
                <span className="text-xs text-blue-600 font-medium">월 구독</span>
                <span className="text-sm font-bold text-blue-800">
                  {formatPrice(subscriptionMonthly)}/월
                </span>
              </div>
            )}
            {rentalAvailable && (
              <div className="flex items-center gap-1.5 bg-green-50 border border-green-200 rounded-lg px-4 py-2">
                <span className="text-xs text-green-700 font-medium">대여 가능</span>
              </div>
            )}
          </div>
        </div>

        {/* 이미지 영역 */}
        <div className="flex-shrink-0 w-full md:w-72 h-60 md:h-72 relative bg-gray-100 rounded-2xl overflow-hidden">
          {heroImageUrl ? (
            <Image
              src={heroImageUrl}
              alt={`${nameKo} 제품 이미지`}
              fill
              className="object-contain"
              sizes="(max-width: 768px) 100vw, 288px"
              priority
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-2">
              <span className="text-5xl">🤖</span>
              <span className="text-sm">이미지 준비 중</span>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
