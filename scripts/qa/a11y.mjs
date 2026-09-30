// Auditoría de accesibilidad complementaria a Lighthouse/axe.
// node scripts/qa/a11y.mjs   (con el servidor corriendo)
// Revisa: jerarquía de headings, un solo h1, alt en imágenes, ids duplicados,
// áreas táctiles ≥ 44×44 en móvil y contraste de las combinaciones de color reales.
import { chromium } from 'playwright';

const BASE = process.env.BASE || 'http://localhost:3000';
const PAGES = ['/', '/landing-page', '/sitio-web', '/tienda-digital', '/redes-sociales', '/pauta-publicitaria', '/privacidad', '/no-existe'];
let fails = 0;
const report = (ok, msg) => { if (!ok) fails++; console.log(`${ok ? '✓' : '✗'} ${msg}`); };

// ---------- Contraste de las combinaciones reales (WCAG 2.1) ----------
const hex = (h) => h.replace('#', '').match(/../g).map((x) => parseInt(x, 16));
const blend = (fg, a, bg) => fg.map((c, i) => Math.round(c * a + bg[i] * (1 - a)));
const lum = (rgb) => {
  const [r, g, b] = rgb.map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };

const BG = hex('#150F2E');
const DEEP = hex('#0E0A1F');
const CARD = hex('#1A1339');
const RAISE = hex('#1C1540');
const ACCENT = hex('#00FF7F');
const INK = hex('#0E0A1F');
const WHITE = hex('#FFFFFF');
const MUTED = hex('#B7B0D6');
const FIELD_BG = blend(DEEP, 0.6, blend(hex('#1C1540'), 0.85, DEEP));
const pairs = [
  ['Texto blanco / fondo', WHITE, BG, 4.5],
  ['Texto secundario / fondo', MUTED, BG, 4.5],
  ['Texto secundario / fondo profundo', MUTED, DEEP, 4.5],
  ['Texto secundario / tarjeta', MUTED, CARD, 4.5],
  ['Texto secundario / hover de tarjeta', MUTED, RAISE, 4.5],
  ['Verde / fondo (números, links, íconos)', ACCENT, BG, 4.5],
  ['Verde / tarjeta', ACCENT, CARD, 4.5],
  ['Texto oscuro / botón verde', INK, ACCENT, 4.5],
  ['Texto oscuro / hover botón (blanco)', INK, WHITE, 4.5],
  ['Placeholder / campo', hex('#8E86B3'), FIELD_BG, 4.5],
  ['Error / fondo', hex('#FF8A9A'), DEEP, 4.5],
  ['Borde de campo / fondo (no textual)', blend(MUTED, 0.55, FIELD_BG), FIELD_BG, 3],
  ['Anillo de foco verde / fondo (no textual)', ACCENT, BG, 3],
  ['Anillo de foco verde / fondo profundo', ACCENT, DEEP, 3],
  ['Borde botón fantasma / fondo (no textual)', blend(MUTED, 0.32, BG), BG, 1], // decorativo: el texto del botón da el contraste
  ['Contorno de números gigantes (decorativo)', blend(ACCENT, 0.55, BG), BG, 1],
];
console.log('— Contraste');
for (const [name, fg, bg, min] of pairs) {
  const r = ratio(fg, bg);
  report(r >= min, `${name}: ${r.toFixed(2)}:1 (mín. ${min}:1)`);
}

// ---------- Estructura y áreas táctiles ----------
const browser = await chromium.launch();
for (const path of PAGES) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  await page.goto(BASE + path, { waitUntil: 'networkidle' });
  const r = await page.evaluate(() => {
    const hs = [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')].map((h) => Number(h.tagName[1]));
    const skips = [];
    hs.forEach((lvl, i) => { if (i && lvl > hs[i - 1] + 1) skips.push(`h${hs[i - 1]}→h${lvl}`); });
    const noAlt = [...document.images].filter((i) => !i.hasAttribute('alt')).map((i) => i.src);
    const alts = [...document.images].map((i) => i.alt).filter(Boolean);
    const dupAlts = alts.filter((a, i) => alts.indexOf(a) !== i);
    const ids = [...document.querySelectorAll('[id]')].map((e) => e.id);
    const dupIds = ids.filter((a, i) => ids.indexOf(a) !== i);
    // Áreas táctiles: controles visibles, excepto links dentro de texto corrido.
    const small = [...document.querySelectorAll('a, button, summary, input, select, textarea')]
      .filter((el) => {
        const cs = getComputedStyle(el);
        if (cs.display === 'none' || cs.visibility === 'hidden' || el.closest('[hidden], [aria-hidden="true"], .hp, .sr-only')) return false;
        if (el.matches('.skip-link')) return false;
        if (el.closest('p, li.faq__a, .prose') && cs.display === 'inline') return false;
        const b = el.getBoundingClientRect();
        return b.width > 0 && (b.width < 44 || b.height < 44);
      })
      .map((el) => `${el.tagName.toLowerCase()}${el.className ? '.' + String(el.className).split(' ')[0] : ''} "${(el.textContent || el.getAttribute('aria-label') || '').trim().slice(0, 30)}" ${Math.round(el.getBoundingClientRect().width)}×${Math.round(el.getBoundingClientRect().height)}`);
    const h1 = document.querySelectorAll('h1').length;
    const lang = document.documentElement.lang;
    const robots = document.querySelector('meta[name=robots]')?.content;
    const canonical = document.querySelector('link[rel=canonical]')?.href;
    const ld = [...document.querySelectorAll('script[type="application/ld+json"]')].map((s) => {
      try { const j = JSON.parse(s.textContent); return [].concat(j['@type']).join('+'); } catch { return 'JSON inválido'; }
    });
    return { skips, noAlt, dupAlts: [...new Set(dupAlts)], dupIds: [...new Set(dupIds)], small, h1, lang, robots, canonical, ld };
  });
  console.log(`\n— ${path}  (robots: ${r.robots}, canonical: ${r.canonical}, JSON-LD: ${r.ld.join(', ') || 'ninguno'})`);
  report(r.h1 === 1, `un solo h1 (${r.h1})`);
  report(!r.skips.length, `headings sin saltos ${r.skips.join(', ')}`);
  report(r.lang === 'es-AR', `lang="${r.lang}"`);
  report(!r.noAlt.length, `todas las imágenes con alt ${r.noAlt.join(', ')}`);
  report(!r.dupAlts.length, `alt únicos ${r.dupAlts.join(' | ')}`);
  report(!r.dupIds.length, `ids únicos ${r.dupIds.join(', ')}`);
  report(!r.small.length, `áreas táctiles ≥ 44 px${r.small.length ? '\n    ' + r.small.join('\n    ') : ''}`);
  await ctx.close();
}
await browser.close();
console.log(fails ? `\n${fails} hallazgos` : '\nSin hallazgos');
process.exit(fails ? 1 : 0);
