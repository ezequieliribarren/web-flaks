// Captura el perfil (encabezado + grilla del feed) de las cuentas de Instagram de data/social.json.
// Uso: npm run capture:social            (todas)
//      npm run capture:social -- senko.ar (solo algunas)
// Guarda public/img/social/<handle>.webp (y -600.webp). Se corre a mano; las imágenes se commitean.
// Instagram muestra el perfil sin sesión pero lo tapa con un cartel de "Abrí la app": se quita antes de capturar.
import { chromium } from 'playwright';
import sharp from 'sharp';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(root, 'public', 'img', 'social');
const only = process.argv.slice(2);
const accounts = JSON.parse(await fs.readFile(path.join(root, 'data', 'social.json'), 'utf8'))
  .filter((a) => !only.length || only.includes(a.handle));

await fs.mkdir(OUT, { recursive: true });
const browser = await chromium.launch();
let ok = 0;

for (const a of accounts) {
  const ctx = await browser.newContext({
    viewport: { width: 430, height: 932 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    locale: 'es-AR',
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
  });
  const page = await ctx.newPage();
  try {
    await page.goto(`https://www.instagram.com/${a.handle}/`, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await page.waitForFunction(() => [...document.images].filter((i) => i.naturalWidth > 100).length >= 6, null, { timeout: 25000 });
    await page.waitForTimeout(3500);
    // Quita el cartel, el fondo oscuro y la barra de "Abrir app".
    await page.evaluate(() => {
      document.querySelectorAll('[role="dialog"], [role="presentation"]').forEach((el) => {
        const fixed = el.closest('div[style*="position"], div') || el;
        el.remove();
        if (fixed !== el && fixed.childElementCount === 0) fixed.remove();
      });
      for (const el of document.querySelectorAll('body *')) {
        const cs = getComputedStyle(el);
        if (cs.position === 'fixed' && el.getBoundingClientRect().height > window.innerHeight * 0.5) el.remove();
      }
      document.documentElement.style.overflow = 'auto';
      document.body.style.overflow = 'auto';
    });
    // Espera a que carguen las imágenes del feed visibles.
    await page.evaluate(() => Promise.all([...document.images].slice(0, 16).map((img) => (img.complete ? null : new Promise((r) => { img.onload = img.onerror = r; setTimeout(r, 5000); })))));
    await page.waitForTimeout(800);
    // Recorte: desde abajo de la barra "Iniciar sesión / Abrir app" (58 px) hasta el final de la 3.ª fila del feed.
    const bottom = await page.evaluate(() => {
      const tiles = [...document.images].map((i) => i.getBoundingClientRect()).filter((r) => r.width > 100 && r.width < window.innerWidth / 2);
      const rows = [...new Set(tiles.map((r) => Math.round(r.top)))].sort((x, y) => x - y);
      const third = rows[2];
      const inRow = tiles.filter((r) => Math.round(r.top) === third);
      return third !== undefined && inRow.length ? Math.max(...inRow.map((r) => r.bottom)) : 900;
    });
    const buf = await page.screenshot({ type: 'png', clip: { x: 0, y: 58, width: 430, height: Math.min(900, Math.round(bottom)) - 58 } });
    const base = path.join(OUT, a.handle);
    await sharp(buf).resize({ width: 860 }).webp({ quality: 82 }).toFile(`${base}.webp`);
    await sharp(buf).resize({ width: 600 }).webp({ quality: 80 }).toFile(`${base}-600.webp`);
    console.log(`✓ ${a.handle}`);
    ok++;
  } catch (err) {
    console.error(`✗ ${a.handle}: ${err.message.split('\n')[0]}`);
  } finally {
    await ctx.close();
  }
}
await browser.close();
console.log(`\nListo: ${ok}/${accounts.length}`);
