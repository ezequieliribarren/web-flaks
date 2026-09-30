// Genera las imágenes Open Graph (1200×630) y los íconos del sitio.
// Uso: npm run og
// - public/img/og/{home,landing-page,sitio-web,tienda-digital}.png
// - public/img/brand/apple-touch-icon.png, public/favicon.ico
// - public/img/brand/logo-icon.png (solo si no existe: es el lugar del logo oficial)
import { chromium } from 'playwright';
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const pub = path.join(root, 'public');
// La fuente va embebida: setContent (about:blank) no puede leer file://
const font = 'data:font/woff2;base64,' + fs.readFileSync(path.join(pub, 'fonts', 'inter-var.woff2')).toString('base64');
const services = JSON.parse(fs.readFileSync(path.join(root, 'data', 'services.json'), 'utf8')).pages;

const wordFile = path.join(pub, 'img', 'brand', 'logo-wordmark.png');
const WORDMARK = fs.existsSync(wordFile)
  ? `<img src="data:image/png;base64,${fs.readFileSync(wordFile).toString('base64')}" style="height:58px">`
  : null;
const brandFile = ['logo-icon.svg', 'logo-icon.png'].map((f) => path.join(pub, 'img', 'brand', f)).find((f) => fs.existsSync(f));
const F_MARK = `<svg viewBox="0 0 48 48" width="96" height="96"><g fill="#00FF7F" transform="translate(9 0) skewX(-14)"><rect x="4" y="12.5" width="11" height="3.2" rx="1.6"/><rect x="7" y="21.8" width="8" height="3.2" rx="1.6" opacity=".75"/><rect x="10" y="31" width="5" height="3.2" rx="1.6" opacity=".5"/><path d="M18 10h20v6.5H25v5.5h11v6.2H25V38h-7z"/></g></svg>`;

const pages = [
  { slug: 'home', eyebrow: 'Agencia digital · Buenos Aires', title: 'Impulsamos tu presencia <em>digital.</em>', sub: 'Desarrollo web · Redes sociales · Pauta publicitaria' },
  { slug: 'landing-page', eyebrow: 'Landing page', title: 'Landing page profesional <em>en 5 días.</em>', sub: 'Optimizada para Google Ads y Meta Ads' },
  { slug: 'sitio-web', eyebrow: 'Sitio web', title: 'Tu sitio web, <em>a medida.</em>', sub: 'SEO incluido · Dominio y hosting el primer año' },
  { slug: 'redes-sociales', eyebrow: 'Redes sociales', title: 'Tus redes, <em>con contenido que conecta.</em>', sub: 'Instagram · Facebook · TikTok · Planes mensuales' },
  { slug: 'pauta-publicitaria', eyebrow: 'Pauta publicitaria', title: 'Tu pauta, <em>que trae clientes.</em>', sub: 'Google Ads · Meta Ads · Mercado Libre Ads' },
  { slug: 'tienda-digital', eyebrow: 'Tienda online', title: 'Tu tienda online <em>con Mercado Pago.</em>', sub: `Lista en ${services['tienda-digital'].delivery}` },
];

const html = (p) => `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face { font-family: Inter; src: url('${font}') format('woff2'); font-weight: 100 900; }
* { margin: 0; box-sizing: border-box; }
body { width: 1200px; height: 630px; font-family: Inter, sans-serif; color: #fff; overflow: hidden;
  background: radial-gradient(60% 80% at 88% 20%, rgba(0,255,127,.22), transparent 60%),
              radial-gradient(70% 70% at 10% 100%, rgba(123,92,255,.35), transparent 60%), #150F2E; }
.wrap { position: absolute; inset: 0; padding: 70px 80px; display: flex; flex-direction: column; justify-content: space-between; }
.top { display: flex; align-items: center; gap: 18px; }
.word { font-size: 40px; font-weight: 900; letter-spacing: -1px; font-style: italic; }
.eyebrow { font-size: 22px; font-weight: 600; letter-spacing: 6px; text-transform: uppercase; color: #00FF7F; display: flex; align-items: center; gap: 16px; }
.eyebrow::before { content: ''; width: 44px; height: 4px; background: #00FF7F; transform: skewX(-30deg); }
h1 { font-size: 92px; line-height: .95; font-weight: 900; letter-spacing: -4.5px; max-width: 980px; margin-top: 22px; }
h1 em { font-style: normal; color: #00FF7F; }
.bottom { display: flex; justify-content: space-between; align-items: flex-end; font-size: 26px; color: #B7B0D6; }
.url { color: #fff; font-weight: 700; }
.rays { position: absolute; right: 60px; top: 90px; display: grid; gap: 16px; justify-items: end; }
.rays i { display: block; height: 8px; border-radius: 4px; background: #00FF7F; transform: skewX(-30deg); }
</style></head><body>
<div class="rays"><i style="width:220px"></i><i style="width:150px;opacity:.7"></i><i style="width:90px;opacity:.45"></i></div>
<div class="wrap">
  <div class="top">${WORDMARK || `${F_MARK}<span class="word">FLAKS</span>`}</div>
  <div><p class="eyebrow">${p.eyebrow}</p><h1>${p.title}</h1></div>
  <div class="bottom"><span>${p.sub}</span><span class="url">flaks.com.ar</span></div>
</div></body></html>`;

const iconHtml = (size) => `<!doctype html><html><head><style>*{margin:0}body{width:${size}px;height:${size}px;display:grid;place-items:center;background:#150F2E}</style></head>
<body>${F_MARK.replace('width="96" height="96"', `width="${Math.round(size * 0.78)}" height="${Math.round(size * 0.78)}"`)}</body></html>`;

fs.mkdirSync(path.join(pub, 'img', 'og'), { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
for (const p of pages) {
  await page.setContent(html(p), { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  const buf = await page.screenshot({ type: 'png' });
  await sharp(buf).png({ compressionLevel: 9, palette: false }).toFile(path.join(pub, 'img', 'og', `${p.slug}.png`));
  console.log(`og/${p.slug}.png`);
}

// Íconos (a partir del logo oficial si existe, si no, del respaldo en SVG).
async function icon(size) {
  if (brandFile) {
    // El logo transparente va centrado sobre el violeta de marca, con aire alrededor.
    const pad = Math.round(size * 0.14);
    const inner = await sharp(brandFile)
      .resize(size - pad * 2, size - pad * 2, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .toBuffer();
    return sharp({ create: { width: size, height: size, channels: 4, background: '#150F2E' } })
      .composite([{ input: inner, left: pad, top: pad }])
      .png()
      .toBuffer();
  }
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(iconHtml(size));
  return page.screenshot({ type: 'png' });
}
fs.writeFileSync(path.join(pub, 'img', 'brand', 'apple-touch-icon.png'), await icon(180));
fs.writeFileSync(path.join(pub, 'favicon.ico'), await icon(32));
fs.writeFileSync(path.join(pub, 'img', 'brand', 'favicon-32.png'), await icon(32));
fs.writeFileSync(path.join(pub, 'img', 'brand', 'favicon-192.png'), await icon(192));
const logoPng = path.join(pub, 'img', 'brand', 'logo-icon.png');
if (!fs.existsSync(logoPng)) fs.writeFileSync(logoPng, await icon(512));
console.log('íconos listos');

// Recursos: portada del carrusel sobre fondo claro (línea visual de recursos).
const recDir = path.join(root, 'data', 'recursos');
for (const f of fs.existsSync(recDir) ? fs.readdirSync(recDir).filter((x) => x.endsWith('.json')) : []) {
  const r = JSON.parse(fs.readFileSync(path.join(recDir, f), 'utf8'));
  const cover = path.join(pub, 'img', 'recursos', r.slug, `${r.cover}.webp`);
  if (!fs.existsSync(cover)) continue;
  const coverB64 = (await sharp(cover).resize({ height: 540 }).png().toBuffer()).toString('base64');
  const logo = WORDMARK ? WORDMARK.replace('height:58px', 'height:30px') : '<b>FLAKS</b>';
  await page.setViewportSize({ width: 1200, height: 630 });
  await page.setContent(`<!doctype html><html><head><meta charset="utf-8"><style>
  @font-face { font-family: Inter; src: url('${font}') format('woff2'); font-weight: 100 900; }
  * { margin: 0; box-sizing: border-box; }
  body { width: 1200px; height: 630px; font-family: Inter, sans-serif; overflow: hidden; color: #0e0a1f;
    background: radial-gradient(70% 90% at 90% 10%, #e3d9ff, transparent 60%), #fafafc;
    display: flex; align-items: center; gap: 56px; padding: 0 70px; }
  .l { flex: 1; display: grid; gap: 22px; }
  .badge { justify-self: start; background: #5a2bea; color: #fff; font-weight: 800; letter-spacing: 3px; font-size: 20px; padding: 10px 22px; border-radius: 999px; text-transform: uppercase; }
  h1 { font-size: 64px; line-height: .98; font-weight: 900; letter-spacing: -3px; }
  h1 em { font-style: normal; color: #5a2bea; }
  .foot { display: flex; align-items: center; gap: 16px; font-size: 22px; font-weight: 700; color: #4b4666; }
  .foot span.logo { background: #0e0a1f; padding: 8px 14px; border-radius: 10px; display: inline-flex; }
  .cover { height: 540px; border-radius: 24px; box-shadow: 0 30px 60px -20px rgba(90,43,234,.5); transform: rotate(3deg); }
  </style></head><body>
  <div class="l"><p class="badge">${r.badge}</p><h1>${r.title.text} <em>${r.title.accent}</em> ${r.title.rest}</h1>
  <div class="foot"><span class="logo">${logo}</span><span>flaks.com.ar/recursos</span></div></div>
  <img class="cover" src="data:image/png;base64,${coverB64}"></body></html>`, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  await sharp(await page.screenshot({ type: 'png' })).png({ compressionLevel: 9 }).toFile(path.join(pub, 'img', 'og', `recurso-${r.slug}.png`));
  console.log(`og/recurso-${r.slug}.png`);
}
await browser.close();
