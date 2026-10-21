import { productEvidence } from '@/lib/product-evidence'

export default function VerifiedFacts({slug}:{slug:string}){
  const record=productEvidence(slug)
  return <section className="rounded-xl border border-gray-200 p-5 flex flex-col gap-3">
    <h2 className="text-lg font-semibold">확인된 자료와 적용 범위</h2>
    <p>{record?.displayModel??'현행 모델 구분 확인 중'}</p>
    {record?.bodyPriceJpy && <p>일본 본체 표시가: {record.bodyPriceJpy.toLocaleString()}엔. 필수 월 서비스료 {record.requiredServiceFromJpyMonthly?.toLocaleString()}엔부터. 한국 판매가가 아닙니다.</p>}
    <p className="text-sm">국내 구매·배송·한국어·앱 이용·보증·수리 조건: 계약 전 별도 확인. 미확인은 미지원 판정과 다릅니다. 배송·세금·통신·수리비를 포함한 총비용은 산정하지 않았습니다.</p>
    {record?.sourceUrl && <a data-action="product_official_open" className="text-blue-700 underline" href={record.sourceUrl} target="_blank" rel="noopener noreferrer">확인한 공식 자료 열기</a>}
    <p className="text-xs text-gray-500">{record?.checkedAt?`해당 출처 대조일: ${record.checkedAt}`:'원문 대조일: 확인 기록 없음'} · 전문가 감수 표시와 별개입니다.</p>
  </section>
}
