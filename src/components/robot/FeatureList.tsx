import React from 'react'

interface Feature {
  icon?: string
  title: string
  description?: string
}

interface FeatureListProps {
  featuresJson: string | null | undefined
}

const DEFAULT_ICONS = ['✓', '✓', '✓', '✓', '✓', '✓', '✓', '✓']

function parseFeatures(json: string | null | undefined): Feature[] {
  if (!json) return []
  try {
    const parsed = JSON.parse(json)
    if (Array.isArray(parsed)) {
      return parsed.map((item) => {
        if (typeof item === 'string') {
          return { title: item }
        }
        if (typeof item === 'object' && item !== null) {
          return {
            icon: item.icon ?? undefined,
            title: item.title ?? item.name ?? String(item),
            description: item.description ?? item.desc ?? undefined,
          }
        }
        return { title: String(item) }
      })
    }
    return []
  } catch {
    return []
  }
}

export default function FeatureList({ featuresJson }: FeatureListProps) {
  const features = parseFeatures(featuresJson)

  if (features.length === 0) return null

  return (
    <section aria-label="주요 기능">
      <h2 className="text-xl font-bold text-gray-900 mb-4">주요 기능</h2>
      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {features.map((feature, index) => (
          <li
            key={index}
            className="flex items-start gap-3 bg-white border border-gray-100 rounded-xl px-4 py-3 shadow-sm"
          >
            <span
              className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-blue-50 text-blue-600 text-base font-bold"
              aria-hidden="true"
            >
              {feature.icon ?? DEFAULT_ICONS[index % DEFAULT_ICONS.length]}
            </span>
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-semibold text-gray-900">
                {feature.title}
              </span>
              {feature.description && (
                <span className="text-xs text-gray-500 leading-relaxed">
                  {feature.description}
                </span>
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
