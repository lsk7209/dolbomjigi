import Link from 'next/link'
import { SITE_URL } from '@/lib/config'
export const metadata={title:'작성·검토 기준',alternates:{canonical:`${SITE_URL}/authors`}}
export default function Authors(){return <main className="max-w-3xl mx-auto px-4 py-10 space-y-5"><h1 className="text-2xl font-bold">작성·검토 기준</h1><p>편집팀 작성, 원문 대조, 전문가 감수를 구분합니다. 등록 프로필이나 기존 감수자 필드만으로 신원·자격·실제 참여가 확인되지는 않습니다. 전문가 인증은 해당 콘텐츠 버전의 근거가 있을 때만 표시합니다.</p><Link className="underline text-blue-700" href="/authors/editor-team">돌봄지기 편집팀</Link><p><Link href="/contact">오류 정정 연락 안내</Link></p></main>}
