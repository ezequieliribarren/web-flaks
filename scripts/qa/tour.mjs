// Uso interno de QA: recorre una página con scroll de rueda y saca capturas cada N px.
// node scripts/tour.mjs /ruta [--mobile] [--reduced] [--step=900] [--count=12] [--prefix=tour]
import { chromium } from 'playwright';
import fs from 'node:fs';

const args = process.argv.slice(2);
const path = args.find((a) => !a.startsWith('--')) || '/';
const flag = (n) => args.includes(`--${n}`);
const opt = (n, d) => (args.find((a) => a.startsWith(`--${n}=`)) || '').split('=')[1] || d;
const mobile = flag('mobile');
const step = Number(opt('step', 900));
const count = Number(opt('count', 12));
const prefix = opt('prefix', 'tour') + (mobile ? '_m' : '');
fs.mkdirSync('.shots', { recursive: true });

const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: mobile ? { width: 390, height: 844 } : { width: Number(opt('w', 1440)), height: Number(opt('h', 900)) },
  isMobile: mobile,
  hasTouch: mobile,
  reducedMotion: flag('reduced') ? 'reduce' : 'no-preference',
});
const page = await ctx.newPage();
const logs = [];
page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) logs.push(`[${m.type()}] ${m.text()}`); });
page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}`));
await page.goto((process.env.BASE || 'http://localhost:3000') + path, { waitUntil: 'networkidle' });
await page.waitForTimeout(1800);
await page.mouse.move(700, 450);
for (let i = 0; i < count; i++) {
  if (i > 0) {
    if (mobile) {
      await page.evaluate((s) => window.scrollBy(0, s), step);
    } else {
      for (let k = 0; k < 10; k++) { await page.mouse.wheel(0, step / 10); await page.waitForTimeout(40); }
    }
    await page.waitForTimeout(1100);
  }
  const y = await page.evaluate(() => Math.round(window.scrollY));
  await page.screenshot({ path: `.shots/${prefix}_${String(i).padStart(2, '0')}.png` });
  console.log(`${prefix}_${String(i).padStart(2, '0')} y=${y}`);
}
if (logs.length) console.log(logs.join('\n'));
await browser.close();
