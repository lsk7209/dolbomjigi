import revisions from '@/content/revisions.json'
import { markdownToHtml } from '@/lib/markdown'

export default function EditorialRevision({path}:{path:string}) {
  if(process.env.NEXT_PUBLIC_LOCAL_PREVIEW!=='1') return <p className="text-sm text-gray-600">이 항목은 자료 대조 중입니다. 제품별 공식 자료와 해당 기관의 현재 안내를 확인하세요.</p>
  const body=(revisions as Record<string,string>)[path]
  if(!body) return null
  return <article className="prose-custom min-w-0 overflow-x-auto" dangerouslySetInnerHTML={{__html:markdownToHtml(body)}}/>
}
