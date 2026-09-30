// Uso interno de QA: capturas de páginas locales en desktop y móvil.
// node scripts/shots.mjs /ruta [--mobile] [--full] [--reduced] [--scroll=1200] [--out=nombre]
import { chromium } from 'playwright';
import fs from 'node:fs';

const args = process.argv.slice(2);
const path = args.find((a) => !a.startsWith('--')) || '/';
const flag = (n) => args.includes(`--${n}`);
const opt = (n, d) => (args.find((a) => a.startsWith(`--${n}=`)) || '').split('=')[1] || d;
const base = process.env.BASE || 'http://localhost:3000';
const mobile = flag('mobile');
const out = opt('out', (path.replace(/\W+/g, '_') || 'home') + (mobile ? '_m' : ''));
fs.mkdirSync('.shots', { recursive: true });

const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: mobile ? { width: 390, height: 844 } : { width: Number(opt('w', 1440)), height: Number(opt('h', 900)) },
  deviceScaleFactor: 1,
  isMobile: mobile,
  hasTouch: mobile,
  reducedMotion: flag('reduced') ? 'reduce' : 'no-preference',
});
const page = await ctx.newPage();
const logs = [];
page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) logs.push(`[${m.type()}] ${m.text()}`); });
page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}`));
await page.goto(base + path, { waitUntil: 'networkidle' });
await page.waitForTimeout(Number(opt('wait', 1600)));
const scroll = Number(opt('scroll', 0));
if (scroll) {
  // Scroll gradual para que ScrollTrigger procese los pasos intermedios.
  const steps = 12;
  for (let i = 1; i <= steps; i++) {
    await page.mouse.wheel(0, scroll / steps);
    await page.waitForTimeout(60);
  }
  await page.waitForTimeout(1200);
}
await page.screenshot({ path: `.shots/${out}.png`, fullPage: flag('full') });
if (logs.length) console.log(logs.join('\n'));
console.log(`.shots/${out}.png`);
await browser.close();
