// Genera las capturas de los proyectos a partir de data/projects.json.
// Uso: npm run capture            (todos los proyectos habilitados)
//      npm run capture -- winman  (solo los slugs indicados)
//
// Por cada proyecto guarda en public/img/projects/:
//   <slug>-hero.webp / <slug>-hero-800.webp  → primer pantallazo (1440×900)
//   <slug>-alt.webp  / <slug>-alt-800.webp   → segunda vista (scroll ~900 px)
// Si un sitio falla, se registra el error y se genera un placeholder de marca.
import { chromium } from 'playwright';
import sharp from 'sharp';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(root, 'public', 'img', 'projects');
const VIEWPORT = { width: 1440, height: 900 };
const QUALITY = 82;
const MAX_W = 1600;

const only = process.argv.slice(2);
const projects = JSON.parse(await fs.readFile(path.join(root, 'data', 'projects.json'), 'utf8'))
  .filter((p) => p.enabled && p.url)
  .filter((p) => !only.length || only.includes(p.slug));

// Selectores habituales de banners de cookies, popups y chats flotantes.
const DISMISS_SELECTORS = [
  'button:has-text("Aceptar")', 'button:has-text("Acepto")', 'button:has-text("Aceptar todo")',
  'button:has-text("Entendido")', 'button:has-text("Accept")', 'button:has-text("OK")',
  '[aria-label="Cerrar"]', '[aria-label="Close"]', '[aria-label="close"]',
  '.js-modal-close', '.modal .close', '.popup-close', '.newsletter-close', '.mfp-close',
  '#onetrust-accept-btn-handler', '.cc-btn.cc-allow', '.cookie-accept', '#cookie-accept',
];
const HIDE_CSS = `
  [id*="cookie" i], [class*="cookie" i], [id*="consent" i], [class*="consent" i],
  [class*="popup" i]:not(body):not(html), [class*="newsletter-modal" i], [class*="modal-backdrop" i],
  [class*="whatsapp" i][style*="fixed"], [class*="wa-float" i], [class*="float-wa" i], a[href*="wa.me"][style*="fixed"],
  [class*="joinchat" i], [id*="joinchat" i], [class*="chat-widget" i], [id*="chat-widget" i],
  iframe[src*="tawk" i], iframe[title*="chat" i], #tidio-chat, .tiktok-embed-float,
  .js-alert-cookie, .js-modal-overlay, .js-newsletter-popup, .modal.show, .modal-backdrop
  { display: none !important; visibility: hidden !important; }
  html, body { overflow: auto !important; }
  *, *::before, *::after { animation-play-state: paused !important; caret-color: transparent !important; }
`;

async function dismiss(page) {
  for (const sel of DISMISS_SELECTORS) {
    try {
      const el = page.locator(sel).first();
      if (await el.isVisible({ timeout: 150 })) await el.click({ timeout: 800 });
    } catch { /* no estaba */ }
  }
  await page.keyboard.press('Escape').catch(() => {});
  await page.addStyleTag({ content: HIDE_CSS }).catch(() => {});
  // Oculta elementos fijos chicos en las esquinas (chats, WhatsApp flotantes).
  await page.evaluate(() => {
    for (const el of document.querySelectorAll('body *')) {
      const cs = getComputedStyle(el);
      if (cs.position !== 'fixed') continue;
      const r = el.getBoundingClientRect();
      const small = r.width < 420 && r.height < 420;
      const corner = r.bottom > window.innerHeight - 260 && (r.left < 200 || r.right > window.innerWidth - 200);
      const overlay = r.width >= window.innerWidth * 0.9 && r.height >= window.innerHeight * 0.9;
      if ((small && corner) || overlay) el.style.setProperty('display', 'none', 'important');
    }
  }).catch(() => {});
}

async function save(buf, slug, kind) {
  const base = path.join(OUT, `${slug}-${kind}`);
  const img = sharp(buf).resize({ width: MAX_W, withoutEnlargement: true });
  await img.clone().webp({ quality: QUALITY }).toFile(`${base}.webp`);
  await sharp(buf).resize({ width: 800 }).webp({ quality: QUALITY }).toFile(`${base}-800.webp`);
}

async function placeholder(slug, title) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1440" height="900" viewBox="0 0 1440 900">
    <defs><radialGradient id="g" cx="75%" cy="30%" r="70%"><stop offset="0" stop-color="#00FF7F" stop-opacity=".18"/><stop offset="1" stop-color="#00FF7F" stop-opacity="0"/></radialGradient></defs>
    <rect width="1440" height="900" fill="#150F2E"/><rect width="1440" height="900" fill="url(#g)"/>
    <g transform="translate(600 250) scale(5)" fill="#00FF7F"><g transform="translate(9 0) skewX(-14)"><rect x="4" y="12.5" width="11" height="3.2" rx="1.6"/><rect x="7" y="21.8" width="8" height="3.2" rx="1.6" opacity=".75"/><rect x="10" y="31" width="5" height="3.2" rx="1.6" opacity=".5"/><path d="M18 10h20v6.5H25v5.5h11v6.2H25V38h-7z"/></g></g>
    <text x="720" y="620" text-anchor="middle" font-family="Arial, sans-serif" font-weight="900" font-size="64" fill="#fff">${title.replace(/&/g, '&amp;')}</text>
  </svg>`;
  const buf = await sharp(Buffer.from(svg)).png().toBuffer();
  await save(buf, slug, 'hero');
  await save(buf, slug, 'alt');
}

await fs.mkdir(OUT, { recursive: true });
const browser = await chromium.launch();
const results = [];

for (const p of projects) {
  const ctx = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: 1,
    locale: 'es-AR',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36',
  });
  const page = await ctx.newPage();
  const t0 = Date.now();
  try {
    await page.goto(p.url, { waitUntil: 'networkidle', timeout: 45000 }).catch(async (e) => {
      // Algunos sitios nunca llegan a "networkidle" (chats, analytics): seguimos si cargó el DOM.
      if (!/Timeout/i.test(e.message)) throw e;
    });
    await page.waitForTimeout(1500);
    await dismiss(page);
    await page.waitForTimeout(400);
    await save(await page.screenshot({ type: 'png' }), p.slug, 'hero');

    // Bajamos de a poco para disparar el lazy-load de imágenes, y esperamos a que terminen.
    for (let y = 150; y <= 900; y += 150) {
      await page.mouse.wheel(0, 150);
      await page.waitForTimeout(120);
    }
    await page.evaluate(() => window.scrollTo(0, 900));
    await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {});
    await page.evaluate(() => Promise.all(
      [...document.images]
        .filter((img) => { const r = img.getBoundingClientRect(); return r.bottom > 0 && r.top < window.innerHeight; })
        .map((img) => (img.complete ? null : new Promise((ok) => { img.onload = img.onerror = ok; setTimeout(ok, 4000); })))
    ));
    await page.waitForTimeout(800);
    await dismiss(page);
    await save(await page.screenshot({ type: 'png' }), p.slug, 'alt');
    results.push({ slug: p.slug, ok: true, ms: Date.now() - t0 });
    console.log(`✓ ${p.slug} (${((Date.now() - t0) / 1000).toFixed(1)} s)`);
  } catch (err) {
    console.error(`✗ ${p.slug}: ${err.message.split('\n')[0]}`);
    await placeholder(p.slug, p.title);
    results.push({ slug: p.slug, ok: false, error: err.message.split('\n')[0] });
  } finally {
    await ctx.close();
  }
}

await browser.close();
const failed = results.filter((r) => !r.ok);
console.log(`\nListo: ${results.length - failed.length} OK, ${failed.length} con placeholder.`);
if (failed.length) console.log(failed.map((f) => `  - ${f.slug}: ${f.error}`).join('\n'));
