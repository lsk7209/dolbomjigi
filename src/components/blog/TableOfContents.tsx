'use client'

import { useState, useEffect, useRef } from 'react'
import type { TocItem } from '@/lib/markdown'

interface Props {
  items: TocItem[]
}

export default function TableOfContents({ items }: Props) {
  const [activeId, setActiveId] = useState<string>('')
  const [mobileOpen, setMobileOpen] = useState(false)
  const observerRef = useRef<IntersectionObserver | null>(null)

  useEffect(() => {
    if (items.length === 0) return

    const headingIds = items.map((item) => item.id)

    observerRef.current = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id)
            break
          }
        }
      },
      { rootMargin: '-80px 0px -60% 0px', threshold: 0 }
    )

    headingIds.forEach((id) => {
      const el = document.getElementById(id)
      if (el) observerRef.current?.observe(el)
    })

    return () => observerRef.current?.disconnect()
  }, [items])

  if (items.length === 0) return null

  const TocList = () => (
    <nav aria-label="목차">
      <ul className="space-y-1">
        {items.map((item) => (
          <li key={item.id} style={{ paddingLeft: item.level === 3 ? '0.75rem' : '0' }}>
            <a
              href={`#${item.id}`}
              onClick={() => setMobileOpen(false)}
              className={`block text-xs py-0.5 leading-relaxed transition-colors hover:text-indigo-600 ${
                activeId === item.id
                  ? 'text-indigo-600 font-semibold'
                  : 'text-gray-500'
              }`}
            >
              {item.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )

  return (
    <>
      {/* 모바일: accordion */}
      <div className="lg:hidden mb-6 border border-gray-200 rounded-xl bg-white overflow-hidden">
        <button
          type="button"
          onClick={() => setMobileOpen((v) => !v)}
          className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-gray-800"
          aria-expanded={mobileOpen}
        >
          <span>목차</span>
          <svg
            className={`h-4 w-4 text-gray-500 transition-transform ${mobileOpen ? 'rotate-180' : ''}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {mobileOpen && (
          <div className="px-4 pb-4 border-t border-gray-100">
            <TocList />
          </div>
        )}
      </div>

      {/* 데스크탑: sticky sidebar */}
      <aside
        className="hidden lg:block sticky top-24 w-56 shrink-0 self-start"
        aria-label="목차 사이드바"
      >
        <div className="border border-gray-200 rounded-xl bg-white px-4 py-4">
          <p className="text-xs font-semibold text-gray-700 mb-3 uppercase tracking-wide">목차</p>
          <TocList />
        </div>
      </aside>
    </>
  )
}
