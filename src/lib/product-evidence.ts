import evidence from '@/content/product-evidence.json'

export function productEvidence(slug:string) {
  return (evidence as Record<string, {displayModel?:string|null;sourceUrl?:string;checkedAt?:string;bodyPriceJpy?:number;requiredServiceFromJpyMonthly?:number;[key:string]:unknown}>)[slug]
}

/** Stored comparison prose has no model-specific source review attached. */
export function comparisonSummary(slug:string):string {
  return slug==='lovot-vs-moflin'
    ? 'LOVOT과 Moflin의 교감 방식, 일본 비용 구조와 국내 서비스 미확인 조건을 구분합니다.'
    : '현재 모델별 기능·요금·지원사업 연결 근거를 대조하기 전입니다. 제품 이름만으로 적합성이나 우열을 판단하지 마세요.'
}
const descriptions:Record<string,string>={
  lovot:'GROOVE X의 교감형 로봇입니다. 일본 판매 모델별 본체값과 필수 월 서비스료를 구분해야 합니다. 국내 구매·언어·수리는 별도 확인이 필요합니다.',
  moflin:'CASIO 일본 판매판 Moflin은 안고 쓰다듬으며 반응을 살피는 AI 펫입니다. 사람의 말을 이해하는 대화 로봇과 다르며 초기 Vanguard 제품과 구별해야 합니다.',
  hyodol:'효돌은 어르신 돌봄에 활용되는 AI·IoT 제품 브랜드입니다. 현행 모델별 기능, 계약 요금과 보호자 알림의 대응 범위는 견적·설명서로 확인해야 합니다.',
}
// Legacy numeric prices/feature lists lack model/market/source evidence. A common
// presentation boundary prevents the old DB from contradicting corrected copy.
export function presentRobot<T extends {slug:string}>(row:T) {
  const known=['hyodol','lovot','moflin','aibo','elliq','paro'].includes(row.slug)
  const maker=row.slug==='lovot'?'GROOVE X Inc.':row.slug==='aibo'?'Sony Corporation':row.slug==='hyodol'?'효돌 (브랜드)':row.slug==='moflin'?'제조 법인 미확인 · CASIO 판매판':'제조사 확인 필요'
  return {...row,manufacturer:maker,price_min:null,price_max:null,subscription_monthly:null,rental_available:false,korea_market:false,
    release_year:null,features_json:null,description_short:descriptions[row.slug]??(known?'공식 제품 자료의 적용 모델과 국내 서비스 조건을 구분해 확인하세요. 의료·안전 효과와 원화 요금은 검증 전입니다.':'제품 모델·제조사 연결 근거 확인 중입니다. 가격·기능·무료 지원을 추천 근거로 사용하지 않습니다.'),
    manufacturer_url:productEvidence(row.slug)?.sourceUrl??null}
}
