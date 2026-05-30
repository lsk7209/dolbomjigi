import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { db } from '@/db/client'
import { infoArticles, authors, researchStudies } from '@/db/schema'
import { eq } from 'drizzle-orm'
import AnswerBlock from '@/components/common/AnswerBlock'
import AuthorBlock from '@/components/common/AuthorBlock'
import Sources from '@/components/common/Sources'
import JsonLdScript from '@/components/seo/JsonLdScript'
import { buildArticleJsonLd, buildBreadcrumbJsonLd } from '@/lib/jsonld'
import { SITE_URL } from '@/lib/config'

export async function generateStaticParams() {
  try {
    const rows = await db.select({ slug: infoArticles.slug }).from(infoArticles)
    return rows.map((r) => ({ slug: r.slug }))
  } catch {
    return []
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const article = await db
    .select({ title_ko: infoArticles.title_ko, summary: infoArticles.summary })
    .from(infoArticles)
    .where(eq(infoArticles.slug, slug))
    .get()

  if (!article) return { title: '페이지를 찾을 수 없습니다' }

  const description = article.summary ?? article.title_ko

  return {
    title: `${article.title_ko} | 돌봄지기 정보`,
    description,
    openGraph: {
      title: article.title_ko,
      description,
      type: 'article',
    },
    alternates: {
      canonical: `${SITE_URL}/info/${slug}`,
    },
  }
}

async function getRelatedResearch(slug: string) {
  const allStudies = await db
    .select({
      id: researchStudies.id,
      slug: researchStudies.slug,
      title: researchStudies.title,
      authors_list: researchStudies.authors_list,
      journal: researchStudies.journal,
      year: researchStudies.year,
      summary_ko: researchStudies.summary_ko,
    })
    .from(researchStudies)

  const words = slug.split('-').filter((w) => w.length > 2)
  return allStudies
    .filter((s) => {
      const text = (s.title + ' ' + (s.summary_ko ?? '')).toLowerCase()
      return words.some((w) => text.includes(w.toLowerCase()))
    })
    .slice(0, 3)
}

export default async function InfoPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  const article = await db
    .select()
    .from(infoArticles)
    .where(eq(infoArticles.slug, slug))
    .get()

  if (!article) notFound()

  const author = article.author_id
    ? await db.select().from(authors).where(eq(authors.id, article.author_id)).get()
    : null

  const relatedResearch = await getRelatedResearch(slug)

  const today = new Date().toISOString().slice(0, 10)
  const publishedAt = article.published_at
    ? new Date(article.published_at).toISOString().slice(0, 10)
    : today

  const jsonLdData = [
    buildArticleJsonLd({
      title: article.title_ko,
      description: article.summary ?? article.title_ko,
      datePublished: publishedAt,
      dateModified: today,
      authorName: author?.name ?? '돌봄지기 편집팀',
      url: `${SITE_URL}/info/${slug}`,
    }),
    buildBreadcrumbJsonLd([
      { name: '홈', url: SITE_URL },
      { name: '정보', url: `${SITE_URL}/info` },
      { name: article.title_ko, url: `${SITE_URL}/info/${slug}` },
    ]),
  ]

  return (
    <>
      <JsonLdScript data={jsonLdData} />

      <main className="mx-auto max-w-3xl px-4 py-10 flex flex-col gap-8">
        <header className="flex flex-col gap-2">
          <nav className="text-xs text-gray-500" aria-label="breadcrumb">
            <ol className="flex items-center gap-1 flex-wrap">
              <li><a href="/" className="hover:underline">홈</a></li>
              <li aria-hidden="true">/</li>
              <li><a href="/info" className="hover:underline">정보</a></li>
              <li aria-hidden="true">/</li>
              <li className="text-gray-800 font-medium">{article.title_ko}</li>
            </ol>
          </nav>
          <h1 className="text-2xl font-bold text-gray-900">{article.title_ko}</h1>
          <p className="text-xs text-gray-500">
            {publishedAt} 게시{author && ` · ${author.name} 작성`}
          </p>
        </header>

        {article.summary && (
          <AnswerBlock>{article.summary}</AnswerBlock>
        )}

        <article
          className="prose prose-sm max-w-none text-gray-800 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: article.body_html }}
        />

        {relatedResearch.length > 0 && (
          <section aria-label="관련 연구 인용">
            <h2 className="text-base font-semibold text-gray-900 mb-3">관련 연구</h2>
            <ul className="flex flex-col gap-3">
              {relatedResearch.map((study) => (
                <li key={study.id} className="border border-gray-200 rounded-lg px-4 py-3 bg-gray-50">
                  <a href={`/research/${study.slug}`} className="flex flex-col gap-1">
                    <span className="text-sm font-medium text-blue-700 hover:underline">{study.title}</span>
                    <span className="text-xs text-gray-500">
                      {study.authors_list}{study.journal && ` · ${study.journal}`}{study.year && ` (${study.year})`}
                    </span>
                    {study.summary_ko && (
                      <p className="text-xs text-gray-600 mt-1 line-clamp-2">{study.summary_ko}</p>
                    )}
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )}

        <Sources
          sources={[
            { type: 'government', label: '보건복지부', url: 'https://www.mohw.go.kr' },
            { type: 'official', label: '돌봄지기 편집팀', url: SITE_URL },
          ]}
        />

        {author && (
          <AuthorBlock
            author={{ name: author.name, role: author.role, slug: author.slug }}
            confirmedAt={today}
          />
        )}
      </main>
    </>
  )
}
