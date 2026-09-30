// Uso interno de QA: Lighthouse móvil sobre una o más rutas locales.
// node scripts/lh.mjs / /landing-page ...   (requiere Chrome/Chromium; usa CHROME_PATH o el de Playwright)
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const BASE = process.env.BASE || 'http://localhost:3000';
const chrome = process.env.CHROME_PATH || chromium.executablePath();
const routes = process.argv.slice(2).length ? process.argv.slice(2) : ['/'];
fs.mkdirSync('.shots', { recursive: true });

for (const route of routes) {
  const out = path.join('.shots', `lh${route.replace(/\W+/g, '_')}.json`);
  try {
    execFileSync('npx', ['-y', 'lighthouse@12', BASE + route, '--quiet', '--chrome-flags=--headless=new --no-sandbox',
      '--output=json', `--output-path=${out}`, '--only-categories=performance,accessibility,seo,best-practices'],
    { env: { ...process.env, CHROME_PATH: chrome }, stdio: 'ignore', shell: true });
  } catch { /* lighthouse sale con código != 0 ante warnings; leemos el JSON igual */ }
  const r = JSON.parse(fs.readFileSync(out, 'utf8'));
  const c = r.categories;
  const a = r.audits;
  console.log(`${route}  ${Object.keys(c).map((k) => `${k}:${Math.round(c[k].score * 100)}`).join(' ')}  | LCP ${a['largest-contentful-paint'].displayValue} | CLS ${a['cumulative-layout-shift'].displayValue} | TBT ${a['total-blocking-time'].displayValue}`);
  const bad = Object.values(a).filter((x) => x.score !== null && x.score < 0.9 && !['informative', 'notApplicable', 'manual'].includes(x.scoreDisplayMode));
  bad.forEach((x) => console.log(`   - ${x.id}: ${x.displayValue || ''}`));
}
