/* FLAKS — Páginas de servicio: texto rotativo, preview del portfolio y CTA fijo. Sin dependencias. */
(function () {
  'use strict';

  var d = document;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Texto rotativo del H1 ---------- */
  var rot = d.querySelector('[data-rotator]');
  if (rot && !reduced) {
    var words = [];
    try { words = JSON.parse(rot.getAttribute('data-rotator')); } catch (e) { words = []; }
    var i = 0;
    if (words.length > 1) {
      setInterval(function () {
        if (d.hidden) return;
        rot.classList.remove('is-in');
        rot.classList.add('is-out');
        setTimeout(function () {
          i = (i + 1) % words.length;
          rot.textContent = words[i];
          rot.classList.remove('is-out');
          rot.classList.add('is-in');
        }, 340);
      }, 2800);
    }
  }

  /* ---------- Portfolio: preview flotante que sigue al cursor (solo mouse) ---------- */
  var list = d.querySelector('[data-plist]');
  var preview = d.querySelector('[data-plist-preview]');
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (list && preview && fine) {
    var img = preview.querySelector('img');
    var x = 0, y = 0, tx = 0, ty = 0, raf = 0;
    var loop = function () {
      x += (tx - x) * (reduced ? 1 : 0.18);
      y += (ty - y) * (reduced ? 1 : 0.18);
      preview.style.transform = 'translate3d(' + x + 'px,' + y + 'px,0) translate(-50%,-50%)';
      raf = Math.abs(tx - x) + Math.abs(ty - y) > 0.5 ? window.requestAnimationFrame(loop) : 0;
    };
    list.addEventListener('mousemove', function (e) {
      tx = e.clientX + 40;
      ty = e.clientY;
      if (!raf) raf = window.requestAnimationFrame(loop);
    });
    Array.prototype.forEach.call(list.querySelectorAll('[data-preview]'), function (row) {
      row.addEventListener('mouseenter', function (e) {
        var src = row.getAttribute('data-preview');
        if (img.getAttribute('src') !== src) img.setAttribute('src', src);
        if (!preview.classList.contains('is-visible')) { x = tx = e.clientX + 40; y = ty = e.clientY; loop(); }
        preview.classList.add('is-visible');
      });
      row.addEventListener('mouseleave', function () { preview.classList.remove('is-visible'); });
    });
  }

  /* ---------- Hero: capturas de proyectos que rotan con fundido ---------- */
  var heroRot = d.querySelector('[data-hero-rotator]');
  if (heroRot) {
    var projects = [];
    try { projects = JSON.parse(heroRot.getAttribute('data-projects')); } catch (e) { projects = []; }
    var mains = heroRot.querySelectorAll('.s-hero__main .rot-img');
    var floats = heroRot.querySelectorAll('.s-hero__float .rot-img');
    var urlEl = heroRot.querySelector('[data-rot-url]');
    var link = heroRot.querySelector('[data-rot-link]');
    var titleEl = heroRot.querySelector('[data-rot-title]');
    var current = 0;
    var paused = false;
    var timer = 0;
    // Las capturas 2 en adelante se cargan recién cuando la página terminó (no compiten con el LCP).
    var loadRest = function () {
      Array.prototype.forEach.call(heroRot.querySelectorAll('img[data-src]'), function (img) {
        if (img.getAttribute('data-srcset')) img.setAttribute('srcset', img.getAttribute('data-srcset'));
        img.setAttribute('src', img.getAttribute('data-src'));
        img.removeAttribute('data-src');
        img.removeAttribute('data-srcset');
      });
    };
    var show = function (n) {
      [mains, floats].forEach(function (list) {
        Array.prototype.forEach.call(list, function (img, i) { img.classList.toggle('is-active', i === n); });
      });
      Array.prototype.forEach.call(mains, function (img, i) { img.alt = i === n ? img.getAttribute('data-alt') : ''; });
      var p = projects[n];
      if (p) {
        if (urlEl) urlEl.textContent = p.host;
        if (link) link.href = p.url;
        if (titleEl) titleEl.textContent = p.title;
      }
      current = n;
    };
    var tick = function () { if (!paused && !d.hidden) show((current + 1) % mains.length); };
    var setPaused = function (v) { paused = v; heroRot.classList.toggle('is-paused', v); };
    heroRot.addEventListener('mouseenter', function () { setPaused(true); });
    heroRot.addEventListener('mouseleave', function () { setPaused(false); });
    heroRot.addEventListener('focusin', function () { setPaused(true); });
    heroRot.addEventListener('focusout', function () { setPaused(false); });
    if (mains.length > 1 && !reduced) {
      // Las demás capturas se piden recién con el navegador libre y la rotación arranca cuando ya están.
      var idle = window.requestIdleCallback || function (fn) { return setTimeout(fn, 1); };
      var start = function () {
        setTimeout(function () {
          idle(function () { loadRest(); timer = window.setInterval(tick, 3500); }, { timeout: 4000 });
        }, 1500);
      };
      if (d.readyState === 'complete') start(); else window.addEventListener('load', start);
    }
  }

  /* ---------- Popup de descuento: una vez por sesión, al llegar a los planes ---------- */
  var promo = d.querySelector('[data-promo]');
  // La sección que dispara el popup se define por página (Redes: planes; landing/sitio/tienda: ¿Es para vos?).
  var plans = promo && d.getElementById(promo.getAttribute('data-promo-trigger') || 'planes');
  var promoId = promo ? promo.getAttribute('data-promo-id') : '';
  if (promo && plans && 'IntersectionObserver' in window) {
    var dl = function (o) { (window.dataLayer = window.dataLayer || []).push(o); };
    var KEY = 'flaks_promo_' + location.pathname;
    var done = false;
    try { done = sessionStorage.getItem(KEY) === '1'; } catch (e) { done = false; }
    var close = function () {
      promo.hidden = true;
      try { sessionStorage.setItem(KEY, '1'); } catch (e) { /* sin storage */ }
    };
    if (!done) {
      var io = new IntersectionObserver(function (entries) {
        if (!entries[0].isIntersecting) return;
        io.disconnect();
        setTimeout(function () {
          promo.hidden = false;
          if (!reduced) promo.classList.add('is-in');
          dl({ event: 'promo_view', promo: promoId, page_path: location.pathname });
        }, 1200);
      }, { threshold: 0.3 });
      io.observe(plans);
    }
    promo.querySelector('[data-promo-close]').addEventListener('click', close);
    promo.querySelector('[data-promo-cta]').addEventListener('click', function () {
      dl({ event: 'promo_click', promo: promoId, page_path: location.pathname });
      close();
    });
    d.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !promo.hidden) close(); });
  }

  /* ---------- CTA fijo en móvil: aparece después del hero y se esconde en el formulario ---------- */
  var sticky = d.querySelector('[data-sticky-cta]');
  var hero = d.querySelector('.s-hero');
  var contact = d.getElementById('contacto');
  if (sticky && hero && 'IntersectionObserver' in window) {
    var heroVisible = true;
    var contactVisible = false;
    var sync = function () { sticky.classList.toggle('is-visible', !heroVisible && !contactVisible); };
    new IntersectionObserver(function (e) { heroVisible = e[0].isIntersecting; sync(); }, { threshold: 0.15 }).observe(hero);
    if (contact) new IntersectionObserver(function (e) { contactVisible = e[0].isIntersecting; sync(); }, { threshold: 0.1 }).observe(contact);
  }
})();
