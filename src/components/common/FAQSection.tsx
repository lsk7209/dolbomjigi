'use client'

import React, { useState } from 'react'
import { buildFAQJsonLd } from '@/lib/jsonld'

interface FAQItem {
  question: string
  answer: string
}

interface FAQSectionProps {
  faqs: FAQItem[]
}

/**
 * FAQ 섹션 컴포넌트.
 *
 * - 아코디언 방식으로 질문/답변을 표시한다.
 * - FAQPage JSON-LD 스크립트 태그를 자동 포함한다.
 * - 키보드 접근성: Enter / Space 키로 토글 가능.
 */
export default function FAQSection({ faqs }: FAQSectionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const toggle = (index: number) => {
    setOpenIndex((prev) => (prev === index ? null : index))
  }

  const jsonLd = buildFAQJsonLd(
    faqs.map(({ question, answer }) => ({ q: question, a: answer })),
  )

  return (
    <section aria-label="자주 묻는 질문">
      {/* FAQPage JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <h2 className="text-xl font-bold text-gray-900 mb-4">자주 묻는 질문</h2>

      <dl className="flex flex-col divide-y divide-gray-200 border border-gray-200 rounded-lg overflow-hidden">
        {faqs.map((faq, index) => {
          const isOpen = openIndex === index
          const panelId = `faq-panel-${index}`
          const headerId = `faq-header-${index}`

          return (
            <div key={index} className="bg-white">
              {/* 질문 (토글 버튼) */}
              <dt>
                <button
                  type="button"
                  id={headerId}
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  onClick={() => toggle(index)}
                  className="flex w-full items-center justify-between px-5 py-4 text-left text-sm font-medium text-gray-900 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                  <span>{faq.question}</span>
                  <span
                    aria-hidden="true"
                    className={`ml-4 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : 'rotate-0'}`}
                  >
                    ▾
                  </span>
                </button>
              </dt>

              {/* 답변 (패널) */}
              <dd
                id={panelId}
                role="region"
                aria-labelledby={headerId}
                hidden={!isOpen}
                className="px-5 pb-4 text-sm text-gray-700 leading-relaxed bg-gray-50"
              >
                {faq.answer}
              </dd>
            </div>
          )
        })}
      </dl>
    </section>
  )
}
