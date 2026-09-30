/* FLAKS — Recursos: progreso de lectura, índice activo, copiar textos, checklist y CTA fijo. Sin dependencias. */
(function () {
  'use strict';

  var d = document;
  var article = d.querySelector('[data-resource]');
  if (!article) return;
  var slug = article.getAttribute('data-resource');
  var dl = function (o) { (window.dataLayer = window.dataLayer || []).push(o); };

  /* ---------- Progreso de lectura (barra, %, CTA fijo, volver arriba, eventos 25/50/75/100) ---------- */
  var bar = d.querySelector('[data-read-bar]');
  var pct = d.querySelector('[data-read-pct]');
  var sticky = d.querySelector('[data-rs-sticky]');
  var toTop = d.querySelector('[data-to-top]');
  var hero = d.querySelector('.rs-hero');
  var sent = {};
  var ticking = false;
  // Medidas en caché: leerlas en cada scroll fuerza recálculos de layout.
  var m = null;
  var measure = function () {
    m = {
      start: article.offsetTop,
      total: Math.max(1, article.offsetHeight - window.innerHeight),
      heroEnd: hero ? hero.offsetTop + hero.offsetHeight - 80 : 400,
    };
  };
  var update = function () {
    ticking = false;
    if (!m) measure();
    var start = m.start;
    var total = m.total;
    var p = Math.min(1, Math.max(0, (window.scrollY - start) / total));
    if (bar) bar.style.transform = 'scaleX(' + p + ')';
    var n = Math.round(p * 100);
    if (pct) pct.textContent = n + '%';
    var pastHero = window.scrollY > m.heroEnd;
    if (sticky) sticky.classList.toggle('is-visible', pastHero && p < 0.97);
    if (toTop) toTop.classList.toggle('is-visible', pastHero);
    [25, 50, 75, 100].forEach(function (m) {
      if (n >= m && !sent[m]) { sent[m] = true; dl({ event: 'resource_progress', resource: slug, percent: m }); }
    });
  };
  window.addEventListener('scroll', function () { if (!ticking) { ticking = true; window.requestAnimationFrame(update); } }, { passive: true });
  window.addEventListener('resize', function () { m = null; update(); });
  // El alto cambia a medida que se dibujan secciones e imágenes: se vuelve a medir sin bloquear.
  if ('ResizeObserver' in window) new ResizeObserver(function () { m = null; }).observe(article);
  (window.requestIdleCallback || function (fn) { return setTimeout(fn, 200); })(update);
  if (toTop) toTop.addEventListener('click', function () {
    window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    var first = d.querySelector('.rs-back');
    if (first) first.focus({ preventScroll: true });
  });

  /* ---------- Índice: resalta el gancho que se está leyendo; en móvil se cierra al elegir ---------- */
  var links = Array.prototype.slice.call(d.querySelectorAll('[data-toc-link]'));
  var toc = d.querySelector('[data-toc]');
  if (toc && window.matchMedia('(max-width: 699px)').matches) toc.open = false;
  links.forEach(function (a) {
    a.addEventListener('click', function () { if (toc && window.matchMedia('(max-width: 699px)').matches) toc.open = false; });
  });
  if ('IntersectionObserver' in window) {
    var byId = {};
    links.forEach(function (a) { byId[a.getAttribute('href').slice(1)] = a; });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        links.forEach(function (a) { a.classList.remove('is-active'); a.removeAttribute('aria-current'); });
        var a = byId[en.target.id];
        if (a) { a.classList.add('is-active'); a.setAttribute('aria-current', 'true'); }
      });
    }, { rootMargin: '-35% 0px -60% 0px' });
    Object.keys(byId).forEach(function (id) { var el = d.getElementById(id); if (el) io.observe(el); });
  }

  /* ---------- Copiar link ---------- */
  var toast = d.querySelector('[data-toast]');
  var toastTimer = 0;
  var showToast = function (msg) {
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.classList.remove('is-visible'); }, 1800);
  };
  var copy = function (text, done) {
    var fallback = function () {
      var ta = d.createElement('textarea');
      ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
      d.body.appendChild(ta); ta.select();
      try { d.execCommand('copy'); } catch (e) { /* sin soporte */ }
      ta.remove(); done();
    };
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).then(done, fallback);
    else fallback();
  };
  var copyUrl = d.querySelector('[data-copy-url]');
  if (copyUrl) copyUrl.addEventListener('click', function () {
    copy(copyUrl.getAttribute('data-copy-url'), function () {
      showToast('Link copiado');
      dl({ event: 'resource_share', resource: slug, method: 'copy' });
    });
  });
  var shareWa = d.querySelector('[data-share="whatsapp"]');
  if (shareWa) shareWa.addEventListener('click', function () { dl({ event: 'resource_share', resource: slug, method: 'whatsapp' }); });

  /* ---------- Checklist con progreso guardado ---------- */
  var KEY = 'flaks_check_' + slug;
  var saved = {};
  try { saved = JSON.parse(localStorage.getItem(KEY) || '{}'); } catch (e) { saved = {}; }
  var checks = Array.prototype.slice.call(d.querySelectorAll('[data-check]'));
  var doneMsg = d.querySelector('[data-check-done]');
  var syncDone = function () { if (doneMsg) doneMsg.hidden = !checks.every(function (c) { return c.checked; }); };
  checks.forEach(function (c) {
    c.checked = !!saved[c.getAttribute('data-check')];
    c.addEventListener('change', function () {
      saved[c.getAttribute('data-check')] = c.checked;
      try { localStorage.setItem(KEY, JSON.stringify(saved)); } catch (e) { /* sin storage */ }
      syncDone();
    });
  });
  syncDone();
})();
