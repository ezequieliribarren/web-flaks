// Uso interno de QA: pruebas de punta a punta del comportamiento clave.
// node scripts/e2e.mjs   (con el servidor corriendo en BASE o localhost:3000)
import { chromium } from 'playwright';

const BASE = process.env.BASE || 'http://localhost:3000';
const browser = await chromium.launch();
let fails = 0;
const check = (name, ok, extra = '') => {
  if (!ok) fails++;
  console.log(`${ok ? '✓' : '✗'} ${name}${extra ? ` — ${extra}` : ''}`);
};

async function newPage(opts = {}) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, ...opts });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  return { ctx, page, errors };
}

// 1) Formulario de la home: validación, envío, generate_lead y UTMs.
{
  const { ctx, page, errors } = await newPage();
  await page.goto(`${BASE}/?utm_source=google&utm_campaign=test`, { waitUntil: 'networkidle' });
  await page.locator('#contacto').scrollIntoViewIfNeeded();
  await page.click('#contacto button[type=submit]');
  check('home: validación en cliente marca nombre', (await page.getAttribute('#nombre-home', 'aria-invalid')) === 'true');
  await page.fill('#nombre-home', 'Prueba QA');
  await page.fill('#telefono-home', '11 5745 5803');
  await page.selectOption('#servicio-home', 'Tienda online');
  let sentBody = '';
  page.on('request', (r) => { if (r.url().includes('/api/contacto')) sentBody = r.postData() || ''; });
  await page.click('#contacto button[type=submit]');
  await page.waitForSelector('[data-form-success]:not([hidden])', { timeout: 5000 }).catch(() => {});
  check('home: mensaje de éxito visible', await page.isVisible('[data-form-success]'));
  check('home: UTMs enviados', sentBody.includes('utm_source=google') && sentBody.includes('utm_campaign=test'), sentBody.slice(0, 120));
  const lead = await page.evaluate(() => (window.dataLayer || []).find((e) => e.event === 'generate_lead'));
  check('home: evento generate_lead en dataLayer', !!lead, JSON.stringify(lead));
  check('home: sin errores de consola', errors.length === 0, errors.join(' | '));
  await ctx.close();
}

// 2) Formularios de las 3 páginas de servicio.
for (const slug of ['landing-page', 'sitio-web', 'tienda-digital', 'redes-sociales', 'pauta-publicitaria']) {
  const { ctx, page, errors } = await newPage();
  await page.goto(`${BASE}/${slug}`, { waitUntil: 'networkidle' });
  await page.fill(`#nombre-${slug}`, 'Prueba QA');
  await page.fill(`#telefono-${slug}`, '1157455803');
  await page.fill(`#detalle-${slug}`, 'Test');
  await page.click('#contacto button[type=submit]');
  await page.waitForSelector('[data-form-success]:not([hidden])', { timeout: 5000 }).catch(() => {});
  const lead = await page.evaluate(() => (window.dataLayer || []).find((e) => e.event === 'generate_lead'));
  check(`${slug}: envío OK + generate_lead`, (await page.isVisible('[data-form-success]')) && !!lead, lead && lead.service);
  check(`${slug}: un solo h1`, (await page.locator('h1').count()) === 1);
  check(`${slug}: sin errores de consola`, errors.length === 0, errors.join(' | '));
  await ctx.close();
}

// 3) Paneles de Redes / Pauta: botón a su página propia; ancla del footer viejo sigue funcionando.
{
  const { ctx, page, errors } = await newPage();
  await page.goto(`${BASE}/#redes-sociales`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  const top = await page.evaluate(() => Math.round(document.getElementById('redes-sociales').getBoundingClientRect().top));
  check('/#redes-sociales scrollea al panel', Math.abs(top) < 120, `top=${top}`);
  await page.waitForTimeout(600);
  check('solapa Redes visible con el panel en pantalla', await page.isVisible('[data-svc-tab="redes-sociales"]'));
  check('solapa Redes: link a /redes-sociales', (await page.getAttribute('[data-svc-tab="redes-sociales"] a', 'href')) === '/redes-sociales');
  check('solapa Pauta oculta mientras se ve Redes', !(await page.isVisible('[data-svc-tab="pauta-publicitaria"]')));
  check('solapa Desarrollo: 3 links', (await page.locator('[data-svc-tab="desarrollo-web"] a').count()) === 3);
  check('solapa Desarrollo: opciones plegadas hasta tocar', (await page.locator('[data-svc-tab="desarrollo-web"] .svc-tab__links').getAttribute('hidden')) !== null);
  check('paneles sin botones propios', (await page.locator('.svc .svc-link, .svc [data-svc-cta]').count()) === 0);
  check('home: sin contenido oculto de acordeones', (await page.locator('[data-accordion], .svc__detail').count()) === 0);
  check('ancla: sin errores de consola', errors.length === 0, errors.join(' | '));
  await ctx.close();
}

// 4) Redirect que queda: /desarrollo-web → 301 a /#servicios.
{
  const { ctx, page } = await newPage();
  const resp = await page.goto(`${BASE}/desarrollo-web/`, { waitUntil: 'networkidle' });
  const chain = resp.request().redirectedFrom();
  check('/desarrollo-web → 301', chain && (await chain.response()).status() === 301);
  check('/desarrollo-web termina en la home', new URL(page.url()).pathname === '/');
  await ctx.close();
}

// 5) Carril (3 destacados) + teclado, y grupos desplegables de "Todos los proyectos".
{
  const { ctx, page, errors } = await newPage();
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  check('carril: 3 tarjetas, una por capítulo', (await page.locator('[data-card]').count()) === 3);
  check('carril: sin panel "Ver todos"', (await page.locator('.rail__end').count()) === 0);
  const featured = await page.$$eval('[data-card] .pcard__title', (els) => els.map((e) => e.textContent.trim()));
  const listed = await page.$$eval('#todos .plist__item', (els) => els.filter((li) => getComputedStyle(li).display !== 'none').map((li) => li.querySelector('.plist__name').textContent.trim()));
  check('lista (desktop): no repite los destacados', featured.every((t) => !listed.includes(t)), featured.join(', '));
  const target = page.locator('[data-card]').nth(2).locator('a.pcard__cta');
  await target.focus();
  await page.waitForTimeout(900);
  const box = await target.boundingBox();
  check('carril: foco en tarjeta la deja dentro del viewport', box && box.x >= 0 && box.x + box.width <= 1440 && box.y >= 0 && box.y <= 900, JSON.stringify(box));
  const counter = await page.textContent('[data-rail-counter]');
  check('carril: contador "03 / 03"', counter.trim() === '03 / 03', counter);

  const group = page.locator('[data-group]').first();
  const visibleBefore = await group.locator('.plist__item:visible').count();
  await group.locator('[data-more]').click();
  await page.waitForTimeout(700);
  const visibleAfter = await group.locator('.plist__item:visible').count();
  check('grupos: "Ver más" despliega el resto', visibleBefore === 3 && visibleAfter > 3, `${visibleBefore} → ${visibleAfter}`);
  check('grupos: aria-expanded', (await group.locator('[data-more]').getAttribute('aria-expanded')) === 'true');
  check('home: sin errores', errors.length === 0, errors.join(' | '));
  await ctx.close();
}

// 5c) Landing de Redes: planes, botón a medida, redes gestionadas y popup de descuento.
{
  const { ctx, page, errors } = await newPage();
  await page.goto(`${BASE}/redes-sociales`, { waitUntil: 'networkidle' });
  const excluded = page.locator('.plan .is-excluded');
  check('Presencia: "Campañas publicitarias" tachado como no incluido', (await excluded.count()) === 1 && (await excluded.textContent()).includes('Campañas publicitarias') && (await excluded.locator('s').count()) === 1);
  check('botón "¿Necesitás algo a medida?" a WhatsApp', ((await page.getAttribute('.s-custom a', 'href')) || '').startsWith('https://wa.me/'));
  check('sin "alcance pago"', !(await page.content()).includes('alcance pago'));
  check('redes gestionadas: 4 perfiles con captura', (await page.locator('.ig-card img').count()) === 4);
  check('FAQ: acceso a la cuenta', (await page.locator('.faq__item summary').allTextContents()).some((t) => t.includes('acceso a mi cuenta')));
  check('popup oculto al entrar', !(await page.isVisible('[data-promo]')));
  await page.evaluate(() => document.getElementById('planes').scrollIntoView());
  await page.waitForTimeout(2000);
  check('popup aparece al llegar a los planes', await page.isVisible('[data-promo]'));
  const view = await page.evaluate(() => (window.dataLayer || []).some((e) => e.event === 'promo_view'));
  check('popup: evento promo_view', view);
  await page.keyboard.press('Escape');
  check('popup: se cierra con Escape', !(await page.isVisible('[data-promo]')));
  await page.reload({ waitUntil: 'networkidle' });
  await page.evaluate(() => document.getElementById('planes').scrollIntoView());
  await page.waitForTimeout(2000);
  check('popup: no vuelve a aparecer en la sesión', !(await page.isVisible('[data-promo]')));
  check('redes: sin errores', errors.length === 0, errors.join(' | '));
  await ctx.close();
}

// 5c-bis) Descuentos en landing / sitio / tienda: aparecen al llegar a "¿Es para vos?".
for (const [slug, pct] of [['landing-page', 5], ['sitio-web', 5], ['tienda-digital', 10]]) {
  const { ctx, page } = await newPage();
  await page.goto(`${BASE}/${slug}`, { waitUntil: 'networkidle' });
  check(`${slug}: popup oculto al entrar`, !(await page.isVisible('[data-promo]')));
  await page.evaluate(() => document.getElementById('para-quien').scrollIntoView());
  await page.waitForTimeout(2000);
  const txt = (await page.textContent('[data-promo]')) || '';
  check(`${slug}: popup de ${pct}% al llegar a "¿Es para vos?"`, (await page.isVisible('[data-promo]')) && txt.includes(`${pct}% OFF`), txt.trim().slice(0, 50));
  check(`${slug}: sin línea de plazos en el hero`, (await page.locator('.s-hero__trust').count()) === 0);
  await ctx.close();
}

// 5e) Recurso "15 ganchos": progreso de lectura, copiar, checklist, CTAs y barra fija móvil.
{
  const { ctx, page, errors } = await newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  await ctx.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto(`${BASE}/recursos/15-ganchos`, { waitUntil: 'networkidle' });
  check('recurso: 15 ganchos', (await page.locator('[data-gancho]').count()) === 15);
  check('recurso: un solo h1', (await page.locator('h1').count()) === 1);
  const waCtas = await page.$$eval('.rs-cta a[href^="https://wa.me/"]', (a) => a.length);
  check('recurso: 3 CTAs intermedios a WhatsApp', waCtas === 3, String(waCtas));
  check('recurso: sin CTA final repetido', (await page.locator('.rs-final').count()) === 0);
  check('recurso: barra fija oculta en la portada', !(await page.evaluate(() => document.querySelector('[data-rs-sticky]').classList.contains('is-visible'))));
  await page.evaluate(() => document.getElementById('gancho-8').scrollIntoView());
  await page.waitForTimeout(600);
  const bar = await page.evaluate(() => document.querySelector('[data-read-bar]').style.transform);
  check('recurso: barra de progreso avanza', /scaleX\(0\.[1-9]/.test(bar), bar);
  check('recurso: barra fija visible al leer', await page.evaluate(() => document.querySelector('[data-rs-sticky]').classList.contains('is-visible')));
  const prog = await page.evaluate(() => (window.dataLayer || []).filter((e) => e.event === 'resource_progress').map((e) => e.percent));
  check('recurso: evento resource_progress', prog.includes(25), prog.join(','));
  check('recurso: sin bloque de ejemplo', (await page.locator('.gancho__example').count()) === 0);
  await page.evaluate(() => document.getElementById('checklist').scrollIntoView());
  await page.locator('.rs-check__list label').first().click();
  await page.reload({ waitUntil: 'networkidle' });
  check('recurso: checklist guardado', await page.locator('[data-check="0"]').isChecked());
  check('recurso: sin errores', errors.length === 0, errors.join(' | '));
  await ctx.close();
}

// 5d) Clases de GTM iguales al sitio actual (los tags de GA4 dependen de ellas).
for (const [slug, c] of [['landing-page', 'lp'], ['sitio-web', 'sw'], ['tienda-digital', 'td']]) {
  const html = await (await fetch(`${BASE}/${slug}`)).text();
  const need = ['gtm-wa-flotante', 'calendly', 'wa-hero', 'wa-planes', 'wa-portfolio', 'wa-cta', 'form', 'submit']
    .map((k) => (k.startsWith('gtm-') ? k : `gtm-${k}-${c}`));
  const missing = need.filter((k) => !html.includes(k));
  check(`${slug}: clases GTM completas`, !missing.length, missing.join(', '));
  check(`${slug}: id #que-incluye`, html.includes('id="que-incluye"'));
}

// 5b) Móvil: sin desborde horizontal en ninguna página (H1 rotativos, visuales, listas).
for (const path of ['/', '/landing-page', '/sitio-web', '/tienda-digital', '/redes-sociales', '/pauta-publicitaria']) {
  const { ctx, page } = await newPage({ viewport: { width: 360, height: 780 }, isMobile: true, hasTouch: true });
  await page.goto(BASE + path, { waitUntil: 'networkidle' });
  let worst = 0;
  for (let i = 0; i < 4; i++) {
    worst = Math.max(worst, await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth));
    const r = await page.evaluate(() => { const el = document.querySelector('[data-rotator]'); return el ? el.getBoundingClientRect().right - window.innerWidth : -1; });
    worst = Math.max(worst, Math.round(r));
    await page.waitForTimeout(2900);
    if (!(await page.locator('[data-rotator]').count())) break;
  }
  check(`360 px ${path}: sin desborde horizontal`, worst <= 0, `exceso ${worst}px`);
  await ctx.close();
}

// 6) Móvil y reduced-motion: carril nativo, sin pines.
for (const [label, opts] of [
  ['móvil', { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }],
  ['reduced-motion', { reducedMotion: 'reduce' }],
]) {
  const { ctx, page, errors } = await newPage(opts);
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  const info = await page.evaluate(() => ({
    pinned: document.querySelector('[data-rail]').classList.contains('is-pinned'),
    spacers: document.querySelectorAll('.pin-spacer').length,
    snap: getComputedStyle(document.querySelector('[data-rail-viewport]')).scrollSnapType,
    overflowX: document.documentElement.scrollWidth > window.innerWidth,
  }));
  check(`${label}: carril sin pin y con snap`, !info.pinned && info.snap.includes('mandatory'), JSON.stringify(info));
  check(`${label}: sin scroll horizontal de página`, !info.overflowX);
  if (label === 'reduced-motion') check('reduced-motion: sin pines', info.spacers === 0);
  check(`${label}: sin errores`, errors.length === 0, errors.join(' | '));
  await ctx.close();
}

await browser.close();
console.log(fails ? `\n${fails} fallas` : '\nTodo OK');
process.exit(fails ? 1 : 0);
