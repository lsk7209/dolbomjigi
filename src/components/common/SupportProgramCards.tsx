import type { SupportProgram } from '@/db/schema'
import { formatSupportDate } from '@/lib/support-date'
import { recruitmentLabel } from '@/lib/trust'

export default function SupportProgramCards({ programs }: { programs: SupportProgram[] }) {
  return <div className="flex flex-col gap-6">
    <p className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm">기존 편집 자료입니다. 사업 운영 상태와 현재 신규 모집은 다릅니다. 등록된 active 값은 현재 신청 가능하다는 근거가 아닙니다. 이 사이트에서 신청을 접수하지 않습니다.</p>
    <p className="text-sm text-gray-500">목록은 사업명, ID 순입니다. 여러 사업을 임의로 하나의 공고로 합치지 않습니다.</p>
    {programs.map(program=><section key={program.id} className="rounded-xl border border-gray-200 p-5 flex flex-col gap-3">
      <h2 className="text-lg font-semibold">{program.name_ko}</h2>
      <p className="font-semibold text-amber-900">{recruitmentLabel(program)}</p>
      <p className="text-sm">사업 운영 상태: 현재 확인 기록 없음. 모집 기간(기존 기록): {formatSupportDate(program.period_start)} ~ {formatSupportDate(program.period_end)}</p>
      <p className="text-sm">신청 주체·대상·지원액·자부담: 해당 연도 원문 공고와 대조 전입니다. 기존 기록의 예산이나 보급 대수를 개인 지원액으로 해석하지 마세요.</p>
      <p className="text-sm">신청 방법: 현재 원문 확인 전입니다. 기관 홈페이지 링크만으로 온라인 접수 가능 여부를 판단할 수 없습니다. 담당 기관에 올해 모집 공고, 신청 주체와 제품, 접수 창구를 문의하세요.</p>
      <div className="flex flex-wrap gap-4 text-sm">
        {safeUrl(program.source_url) && <a data-action="support_source_open" href={program.source_url} target="_blank" rel="noopener noreferrer" className="text-blue-700 underline">등록된 출처 안내 열기 (상세 공고 여부 별도 확인)</a>}
        {safeUrl(program.application_url) && program.application_url!==program.source_url && <a href={program.application_url!} target="_blank" rel="noopener noreferrer" className="text-blue-700 underline">등록된 기관 안내 열기</a>}
      </div>
      <p className="text-xs text-gray-500">원문 대조일: 확인 기록 없음 · 이용 조건: 원문별 확인 필요 · 편집 검토와 전문가 감수는 별개입니다.</p>
    </section>)}
  </div>
}
function safeUrl(value:string|null):boolean { try { return !!value && ['http:','https:'].includes(new URL(value).protocol) } catch {return false} }
