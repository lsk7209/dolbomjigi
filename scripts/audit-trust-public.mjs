import { writeFile, mkdir } from 'node:fs/promises';
const host = 'https://dolbomjigi.ehon365.kr';
const out = 'docs/trust-20261020';
await mkdir(out, { recursive: true });
const checkedAt = new Date().toISOString();
const fetchOne = async path => {
  let url = new URL(path, host), chain = [];
  for (let i = 0; i < 5; i++) {
    if (url.origin !== host) return { path, excluded: 'off-host redirect', chain };
    try {
      const r = await fetch(url, { redirect: 'manual', signal: AbortSignal.timeout(18000) });
      chain.push({ url: url.href, status: r.status });
      if (r.status >= 300 && r.status < 400 && r.headers.get('location')) { url = new URL(r.headers.get('location'), url); continue; }
      const body = await r.text();
      if (r.status === 429 || r.status >= 500) await new Promise(resolve => setTimeout(resolve, 1500));
      return { path, url: url.href, status: r.status, chain, xRobots: r.headers.get('x-robots-tag'), server: r.headers.get('server'), canonical: body.match(/<link[^>]*rel="canonical"[^>]*href="([^"]+)"/)?.[1], title: body.match(/<title>([\s\S]*?)<\/title>/)?.[1], description: body.match(/<meta[^>]*name="description"[^>]*content="([^"]*)"/)?.[1], robots: [...body.matchAll(/<meta[^>]*name="(?:robots|googlebot)"[^>]*content="([^"]*)"/g)].map(m=>m[1]), h1: [...body.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/g)].map(m=>m[1].replace(/<[^>]*>/g,'')), mainCount: (body.match(/<main\b/g)||[]).length, jsonldCount: (body.match(/application\/ld\+json/g)||[]).length, bytes: body.length, body };
    } catch (e) { return { path, chain, error: e.name }; }
  }
  return { path, chain, error: 'redirect limit' };
};
const sitemap = await fetchOne('/sitemap.xml');
const inventory = [...(sitemap.body ?? '').matchAll(/<loc>([^<]+)<\/loc>/g)].map(m=>m[1]).filter(u=>new URL(u).origin===host);
await writeFile(`${out}/public-inventory.json`, JSON.stringify({ checkedAt, kind:'sitemap-discovered URLs, not confirmed public or indexable', count:inventory.length, urls:inventory },null,2));
const priorities = ['/', '/robots.txt','/sitemap.xml','/feed.xml','/llms.txt','/og-image.png','/apple-touch-icon.png','/compare/lovot-vs-moflin','/robot/lovot','/robot/hyodol','/robot/moflin','/ranking/senior-friendly','/ranking/government-supported','/blog/lovot-real-user-experience','/blog/hyodol-monthly-fee-breakdown','/blog/hyodol-vs-dasom-comparison','/about','/contact','/privacy','/terms','/authors/editor-team','/authors/editorial-team'];
for (const type of ['guide','info','research','support/national','support/region','business','compare','robot','blog']) {
  priorities.push(...inventory.filter(u=>new URL(u).pathname.startsWith(`/${type}/`)).slice(0,3).map(u=>new URL(u).pathname));
}
const paths=[...new Set(priorities)].slice(0,60), results=[];
for (const path of paths) { const r = await fetchOne(path); if (path==='/') await writeFile(`${out}/home-public.html`, r.body ?? ''); delete r.body; results.push(r); }
await writeFile(`${out}/public-audit.json`, JSON.stringify({ checkedAt, method:'ordinary HTTP GET; not browser or actual searchbot', limits:{concurrency:1,maxUrls:60,redirects:5,retries:0,timeoutMs:18000}, inspected:results.length, excluded:'off-host URLs; authenticated reports; remaining sitemap URLs not fetched', results },null,2));
console.log(JSON.stringify({ inspected:results.length, sitemapUrls:inventory.length, failures:results.filter(r=>r.error||r.status>=400).map(r=>({path:r.path,status:r.status,error:r.error})) }));
