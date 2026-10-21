// Deterministic editorial proposal from the captured read-only snapshot.
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const readJson = async (relative) => JSON.parse(await readFile(path.join(root, relative), 'utf8'));
const snapshot = await readJson('.goal-harness/local-data/public-snapshot.json');
const revisions = await readJson('src/content/revisions.json');
const evidence = await readJson('src/content/product-evidence.json');
const sources = await readJson('docs/trust-20261020/sources.json');
const rows = [];
const hash = (row) => {
  const semantic = Object.fromEntries(Object.entries(row).filter(([key]) => !['created_at', 'updated_at'].includes(key)).sort(([a], [b]) => a.localeCompare(b)));
  return createHash('sha256').update(JSON.stringify(semantic)).digest('hex');
};

function add(table, slug, changes, refs) {
  const before = snapshot.tables[table].find((row) => row.slug === slug);
  if (!before || snapshot.tables[table].filter((row) => row.slug === slug).length !== 1) throw new Error(`Missing or duplicate snapshot row: ${table}/${slug}`);
  if (Object.keys(changes).some((field) => !(field in before))) throw new Error(`Unknown field: ${table}/${slug}`);
  rows.push({ table, id: before.id, slug, beforeHash: hash(before), afterHash: hash({ ...before, ...changes }), fields: Object.fromEntries(Object.entries(changes).map(([field, after]) => [field, { before: before[field], after }])), evidence: refs });
}

const editorial = [
  ['blog_posts', 'lovot-real-user-experience', '/blog/lovot-real-user-experience', 'LOVOT 실제 사용 후기 찾기 전 확인할 공식 정보', '직접 사용 후기가 아닙니다. 일본 제조사 가격과 서비스 조건을 바탕으로 후기에서 확인할 질문을 정리했습니다.'],
  ['blog_posts', 'hyodol-monthly-fee-breakdown', '/blog/hyodol-monthly-fee-breakdown', '효돌 월 이용료: 현행 견적에서 확인할 항목', '기존 원화 가격과 월 이용료는 제조사 공개 자료만으로 확인되지 않았습니다. 견적의 구성과 계약 조건을 확인하세요.'],
  ['blog_posts', 'hyodol-vs-dasom-comparison', '/blog/hyodol-vs-dasom-comparison', '효돌과 다솜 비교: 확인된 정보와 미확인 항목', '현재 모델별 공식 사양과 요금이 충분히 확인되지 않았습니다. 제품별 계약서와 제조사 자료를 대조하세요.'],
  ['guides', 'mom-living-alone', '/guide/mom-living-alone', '혼자 사시는 어머니의 하루를 돕는 돌봄로봇 선택법'],
  ['guides', 'welfare-center-coordinator', '/guide/welfare-center-coordinator', '복지관·돌봄센터의 돌봄로봇 도입: 시범 운영부터 사후 평가까지'],
];
for (const [table, slug, route, title, summary] of editorial) {
  const body = revisions[route];
  if (typeof body !== 'string' || body.length < 200) throw new Error(`Missing revision: ${route}`);
  const refs = sources.rows.filter((item) => item.sourceUrl && body.includes(item.sourceUrl)).map((item) => ({ url: item.sourceUrl, status: item.status }));
  add(table, slug, { title_ko: title, ...(summary ? { summary } : {}), body_md: body, ...(table === 'guides' ? { recommended_robots_json: JSON.stringify([]) } : {}) }, refs.length ? refs : [{ url: null, status: 'editorial_checklist_no_product_claim' }]);
}
const comparisonSlug = 'lovot-vs-moflin';
add('comparisons', comparisonSlug, {
  title_ko: 'LOVOT와 Moflin 비교: 사용 방식과 일본 비용 구조',
  summary: 'LOVOT은 일본 공식 가격에 필수 월 서비스료가 별도입니다. Moflin PE-M11은 일본 모델별 표시가격과 선택형 지원 멤버십을 확인해야 합니다. 한국 판매·수리 조건은 미확인입니다.',
  pros_a_json: JSON.stringify(['자율 이동과 반응', '일본 공식 가격 및 필수 월 서비스료 공개']),
  pros_b_json: JSON.stringify(['안고 쓰다듬는 교감 방식', 'CASIO 일본 모델별 판매 정보 공개']),
  recommended_persona: '이동형 교감을 원하면 LOVOT, 손에 안는 작은 AI 펫을 원하면 Moflin을 검토하세요. 한국 구매·수리 조건과 총비용은 계약 전 별도 확인이 필요합니다.',
}, [{ url: 'https://lovot.life/pricing', status: 'confirmed_official_japan' }, { url: 'https://www.casio.com/jp/moflin/products/', status: 'confirmed_official_japan' }]);

const unverified = '현행 모델·가격·세부 기능은 공식 제품 자료로 확인되지 않았습니다. 구매 전 제조사 제품 문서와 견적을 요청하세요.';
const robotDescriptions = {
  hyodol: '㈜효돌의 국내 고령자 돌봄 로봇·서비스입니다. 현행 모델의 가격과 안전 기능은 공식 견적·설명서 확인이 필요합니다.',
  aibo: 'Sony의 일본 반려 로봇입니다. 이용에는 일본 공식 기본 플랜이 필요하며 한국 판매·요금은 확인되지 않았습니다.',
  lovot: 'GROOVE X의 일본 교감형 로봇입니다. 본체값과 필수 월 서비스료가 별도이며 한국 판매·수리 조건은 확인되지 않았습니다.',
  moflin: 'CASIO 일본 판매 Moflin은 접촉과 소리에 반응하는 AI 펫입니다. 사람의 말뜻을 이해하는 돌봄 기기는 아닙니다.',
  elliq: 'Intuition Robotics의 고령자 동반 서비스입니다. 미국 판매 조건과 한국 제공·가격 조건은 별도 확인이 필요합니다.',
  paro: 'AIST가 개발한 물개형 로봇입니다. 개인별 효과는 다르며 의료적 효능을 보장하지 않습니다.',
};
for (const robot of snapshot.tables.robots) {
  const source = sources.rows.filter((item) => item.slug === robot.slug).map((item) => ({ url: item.sourceUrl, status: item.status, field: item.field }));
  const changes = {
    price_min: null, price_max: null, subscription_monthly: null,
    description_short: robotDescriptions[robot.slug] ?? unverified,
    features_json: JSON.stringify([]),
  };
  if (robot.slug === 'moflin') { changes.manufacturer = 'CASIO (일본 판매 모델)'; changes.release_year = null; }
  if (['hyodol', 'dasom-k', 'dasom-b', 'dasom-m', 'kkumdoli', 'bomi', 'raemi', 'maibom', 'paro'].includes(robot.slug)) changes.release_year = null;
  if (['kkumdoli', 'bomi', 'raemi', 'maibom'].includes(robot.slug)) changes.manufacturer = '미확인';
  add('robots', robot.slug, changes, source.length ? source : [{ url: null, status: 'unverified_no_primary_source' }]);
}
if (rows.length !== 19 || snapshot.tables.robots.length !== 13 || !evidence.lovot) throw new Error('Unexpected plan size or evidence');
const plan = { version: 1, domain: 'dolbomjigi.ehon365.kr', snapshotCapturedAt: snapshot.capturedAt, status: 'local editorial proposal; production approval required', rowCap: 19, rows };
const target = path.join(root, 'docs/trust-20261020/data-plan.json');
await writeFile(target, `${JSON.stringify(plan, null, 2)}\n`);
console.log(JSON.stringify({ target, rows: rows.length, fields: rows.reduce((n, row) => n + Object.keys(row.fields).length, 0) }));
