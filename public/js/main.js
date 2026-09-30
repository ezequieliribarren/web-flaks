/* FLAKS — JS común a todas las páginas (sin dependencias). */
(function () {
  'use strict';

  var d = document;
  var root = d.documentElement;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced) root.classList.add('no-motion');

  var dl = function (obj) {
    (window.dataLayer = window.dataLayer || []).push(obj);
  };

  /* ---------- UTMs: se guardan en la sesión para adjuntarlos al formulario ---------- */
  var UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'gclid', 'fbclid'];
  var utm = {};
  try { utm = JSON.parse(sessionStorage.getItem('flaks_utm') || '{}'); } catch (e) { utm = {}; }
  var params = new URLSearchParams(location.search);
  var fresh = {};
  UTM_KEYS.forEach(function (k) { if (params.get(k)) fresh[k] = params.get(k).slice(0, 200); });
  if (Object.keys(fresh).length) {
    utm = fresh;
    try { sessionStorage.setItem('flaks_utm', JSON.stringify(utm)); } catch (e) { /* sin storage */ }
  }

  window.FLAKS = window.FLAKS || {};
  window.FLAKS.reduced = reduced;

  /* ---------- Header: se oculta al bajar y aparece al subir ---------- */
  var header = d.querySelector('[data-header]');
  var menuOpen = false;
  var keepHeader = d.body.classList.contains('page-service');
  var lastY = window.scrollY;
  var ticking = false;
  function onScroll() {
    var y = window.scrollY;
    if (header) {
      header.classList.toggle('is-scrolled', y > 20);
      // En páginas de servicio el header (con su CTA) queda fijo en desktop; en móvil está la barra inferior.
      var keep = keepHeader && window.innerWidth >= 900;
      if (!menuOpen && !keep) header.classList.toggle('is-hidden', y > lastY + 2 && y > 320);
      if (y < lastY - 2) header.classList.remove('is-hidden');
    }
    lastY = y;
    ticking = false;
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { window.requestAnimationFrame(onScroll); ticking = true; }
  }, { passive: true });
  onScroll();
  if (header) header.addEventListener('focusin', function () { header.classList.remove('is-hidden'); });

  /* ---------- Menú móvil ---------- */
  var toggle = d.querySelector('[data-menu-toggle]');
  var menu = d.querySelector('[data-mobile-menu]');
  function setMenu(open) {
    if (!toggle || !menu) return;
    menuOpen = open;
    toggle.setAttribute('aria-expanded', String(open));
    toggle.querySelector('.sr-only').textContent = open ? 'Cerrar menú' : 'Abrir menú';
    menu.hidden = !open;
    d.body.classList.toggle('menu-open', open);
    if (window.lenis) { open ? window.lenis.stop() : window.lenis.start(); }
    if (open) {
      header.classList.remove('is-hidden');
      var first = menu.querySelector('a');
      if (first) first.focus();
    }
  }
  if (toggle && menu) {
    toggle.addEventListener('click', function () { setMenu(!menuOpen); });
    menu.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
    d.addEventListener('keydown', function (e) {
      if (!menuOpen) return;
      if (e.key === 'Escape') { setMenu(false); toggle.focus(); return; }
      if (e.key !== 'Tab') return;
      // Foco atrapado entre el botón del menú y los links del menú.
      var items = [toggle].concat(Array.prototype.slice.call(menu.querySelectorAll('a, button')));
      var i = items.indexOf(d.activeElement);
      var next = e.shiftKey ? (i <= 0 ? items.length - 1 : i - 1) : (i === items.length - 1 ? 0 : i + 1);
      e.preventDefault();
      items[next].focus();
    });
    window.matchMedia('(min-width: 900px)').addEventListener('change', function (e) { if (e.matches) setMenu(false); });
  }

  /* ---------- Tracking de clics (dataLayer) ---------- */
  d.addEventListener('click', function (e) {
    var wa = e.target.closest('[data-wa]');
    if (wa) dl({ event: 'whatsapp_click', click_location: wa.getAttribute('data-wa'), page_path: location.pathname });
    var booking = e.target.closest('[data-booking]');
    if (booking) dl({ event: 'booking_click', page_path: location.pathname });
    var pre = e.target.closest('[data-preselect]');
    if (pre) {
      var sel = d.querySelector('[data-service-select]');
      if (sel) sel.value = pre.getAttribute('data-preselect');
    }
  });

  /* ---------- Formularios de contacto ---------- */
  function setError(form, name, msg) {
    var input = form.querySelector('[name="' + name + '"]');
    if (!input) return;
    var field = input.closest('.field');
    var err = field && field.querySelector('.field__error');
    if (msg) {
      field.setAttribute('data-invalid', '');
      input.setAttribute('aria-invalid', 'true');
    } else {
      field.removeAttribute('data-invalid');
      input.removeAttribute('aria-invalid');
    }
    if (err) err.textContent = msg || '';
  }

  function validate(form) {
    var errors = {};
    var nombre = (form.nombre && form.nombre.value.trim()) || '';
    var tel = (form.telefono && form.telefono.value.replace(/\D/g, '')) || '';
    var email = form.email ? form.email.value.trim() : '';
    if (nombre.length < 2) errors.nombre = 'Contanos tu nombre.';
    if (tel.length < 8 || tel.length > 15) errors.telefono = 'Dejanos un teléfono con código de área, por ejemplo 11 5745 5803.';
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) errors.email = 'Revisá el email: parece incompleto.';
    return errors;
  }

  d.querySelectorAll('[data-contact-form]').forEach(function (form) {
    var status = form.querySelector('[data-form-status]');
    var btn = form.querySelector('button[type="submit"]');
    var btnHtml = btn.innerHTML;
    var success = form.nextElementSibling && form.nextElementSibling.matches('[data-form-success]') ? form.nextElementSibling : null;
    var started = false;

    form.addEventListener('focusin', function () {
      if (!started) { started = true; dl({ event: 'form_start', form_location: form.getAttribute('data-form-location') }); }
    });
    form.addEventListener('input', function (e) {
      if (e.target.name && e.target.getAttribute('aria-invalid')) setError(form, e.target.name, '');
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      status.textContent = '';
      status.removeAttribute('data-state');
      ['nombre', 'telefono', 'email'].forEach(function (n) { setError(form, n, ''); });

      var errors = validate(form);
      var keys = Object.keys(errors);
      if (keys.length) {
        keys.forEach(function (k) { setError(form, k, errors[k]); });
        var firstBad = form.querySelector('[name="' + keys[0] + '"]');
        if (firstBad) firstBad.focus();
        // Envío inválido: no lo dejamos llegar al listener de GTM (gtm.formSubmit), así no cuenta como lead.
        e.stopPropagation();
        return;
      }

      var body = new URLSearchParams(new FormData(form));
      Object.keys(utm).forEach(function (k) { body.set(k, utm[k]); });

      btn.setAttribute('aria-busy', 'true');
      btn.textContent = 'Enviando…';

      fetch(form.action, {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: body,
      })
        .then(function (r) { return r.json().then(function (j) { return { status: r.status, body: j }; }); })
        .then(function (res) {
          if (res.body && res.body.ok) {
            dl({
              event: 'generate_lead',
              form_location: form.getAttribute('data-form-location'),
              service: (form.servicio && form.servicio.value) || '',
              page_path: location.pathname,
            });
            if (success) {
              form.hidden = true;
              success.hidden = false;
              success.focus();
            } else {
              status.textContent = '¡Listo! Recibimos tu consulta.';
            }
            return;
          }
          if (res.body && res.body.errors) {
            Object.keys(res.body.errors).forEach(function (k) { setError(form, k, res.body.errors[k]); });
          }
          status.setAttribute('data-state', 'error');
          status.textContent = (res.body && res.body.error) || 'No pudimos enviar tu consulta. Probá de nuevo o escribinos por WhatsApp.';
        })
        .catch(function () {
          status.setAttribute('data-state', 'error');
          status.textContent = 'No pudimos conectarnos. Revisá tu conexión o escribinos por WhatsApp.';
        })
        .then(function () {
          btn.removeAttribute('aria-busy');
          btn.innerHTML = btnHtml;
        });
    });
  });

  /* ---------- Reveals genéricos ---------- */
  var reveals = d.querySelectorAll('[data-reveal]');
  if (reveals.length) {
    if (reduced || !('IntersectionObserver' in window)) {
      reveals.forEach(function (el) { el.classList.add('is-in'); });
    } else {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
        });
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
      reveals.forEach(function (el) { io.observe(el); });
    }
  }

  /* ---------- VSL: panel lateral con el video (se carga recién al abrirlo) ---------- */
  var vsl = d.querySelector('[data-vsl]');
  var vslOpenBtn = d.querySelector('[data-vsl-open]');
  if (vsl && vslOpenBtn) {
    var frame = vsl.querySelector('[data-vsl-frame]');
    var kind = vsl.getAttribute('data-kind');
    var src = vsl.getAttribute('data-src');
    var vslOpen = false;
    var mountVideo = function () {
      if (!kind || frame.querySelector('iframe, video')) return;
      var el;
      if (kind === 'iframe') {
        el = d.createElement('iframe');
        el.src = src;
        el.title = 'Video: así trabajamos en FLAKS';
        el.allow = 'autoplay; fullscreen; picture-in-picture; encrypted-media';
        el.setAttribute('allowfullscreen', '');
      } else {
        el = d.createElement('video');
        el.src = src;
        if (vsl.getAttribute('data-poster')) el.poster = vsl.getAttribute('data-poster');
        el.controls = true;
        el.autoplay = true;
        el.playsInline = true;
      }
      frame.appendChild(el);
    };
    var setVsl = function (open) {
      if (open === vslOpen) return;
      vslOpen = open;
      vslOpenBtn.setAttribute('aria-expanded', String(open));
      if (open) {
        vsl.hidden = false;
        if (peekVideo) peekVideo.pause();
        mountVideo();
        window.requestAnimationFrame(function () { window.requestAnimationFrame(function () { vsl.classList.add('is-open'); }); });
        d.body.classList.add('menu-open');
        if (window.lenis) window.lenis.stop();
        vsl.querySelector('.vsl__close').focus();
        dl({ event: 'vsl_open', page_path: location.pathname });
      } else {
        vsl.classList.remove('is-open');
        d.body.classList.remove('menu-open');
        if (window.lenis) window.lenis.start();
        // Al cerrar se quita el reproductor: así el video deja de sonar.
        setTimeout(function () {
          if (vslOpen) return;
          vsl.hidden = true;
          var media = frame.querySelector('iframe, video');
          if (media) media.remove();
        }, reduced ? 0 : 550);
        vslOpenBtn.focus();
        dl({ event: 'vsl_close', page_path: location.pathname });
      }
    };
    vslOpenBtn.addEventListener('click', function () { setVsl(true); });

    // Adelanto sin sonido en la tarjeta: arranca con la página ya cargada (con movimiento reducido, solo la portada).
    var peekVideo = vslOpenBtn.querySelector('video[data-src]');
    if (peekVideo && !reduced) {
      var startPeek = function () {
        peekVideo.src = peekVideo.getAttribute('data-src');
        peekVideo.removeAttribute('data-src');
        var pr = peekVideo.play();
        if (pr && pr.catch) pr.catch(function () { /* autoplay bloqueado: queda la portada */ });
      };
      // Se pide recién 3 s después de la carga y con el navegador libre: no compite con la carga inicial.
      var idlePeek = function () { (window.requestIdleCallback || function (fn) { return setTimeout(fn, 1); })(startPeek, { timeout: 3000 }); };
      if (d.readyState === 'complete') setTimeout(idlePeek, 3000); else window.addEventListener('load', function () { setTimeout(idlePeek, 3000); });
    }

    // En móvil la tarjeta se ubica dentro del hero (abajo a la derecha); en desktop, fija a media altura.
    var heroEl = d.querySelector('.hero');
    var mqMobile = window.matchMedia('(max-width: 899px)');
    var placePeek = function () {
      if (mqMobile.matches && heroEl) {
        heroEl.appendChild(vslOpenBtn);
        vslOpenBtn.classList.add('is-inline');
      } else if (vslOpenBtn.parentNode !== vsl.parentNode) {
        vsl.parentNode.insertBefore(vslOpenBtn, vsl);
        vslOpenBtn.classList.remove('is-inline');
      }
    };
    placePeek();
    mqMobile.addEventListener('change', placePeek);

    // La tarjeta solo se muestra arriba de todo (en el hero): al scrollear se va, y vuelve al subir.
    var syncPeek = function () {
      var away = window.scrollY > 120;
      vslOpenBtn.classList.toggle('is-away', away);
      if (peekVideo && !peekVideo.hasAttribute('data-src')) { if (away) peekVideo.pause(); else if (!vslOpen) peekVideo.play().catch(function () {}); }
    };
    window.addEventListener('scroll', syncPeek, { passive: true });
    syncPeek();
    Array.prototype.forEach.call(vsl.querySelectorAll('[data-vsl-close]'), function (b) {
      b.addEventListener('click', function () { setVsl(false); });
    });
    d.addEventListener('keydown', function (e) {
      if (!vslOpen) return;
      if (e.key === 'Escape') { setVsl(false); return; }
      if (e.key !== 'Tab') return;
      // Foco atrapado dentro del panel.
      var items = Array.prototype.slice.call(vsl.querySelectorAll('button, a[href], iframe, video'));
      var i = items.indexOf(d.activeElement);
      e.preventDefault();
      items[e.shiftKey ? (i <= 0 ? items.length - 1 : i - 1) : (i === items.length - 1 ? 0 : i + 1)].focus();
    });
  }

  /* ---------- Cursor negativo (solo mouse, sin reduced-motion) ---------- */
  var cursor = d.querySelector('[data-cursor]');
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (cursor && fine && !reduced) {
    root.classList.add('has-cursor');
    var TEXT = 'h1, h2, h3, h4, .manifesto__text, .plist__name, .review__text, .display';
    var cx = -100, cy = -100, tx = -100, ty = -100, raf = 0;
    var loop = function () {
      cx += (tx - cx) * 0.25;
      cy += (ty - cy) * 0.25;
      cursor.style.transform = 'translate3d(' + cx + 'px,' + cy + 'px,0)';
      // El loop se detiene cuando el cursor llega a destino: no consume CPU con el mouse quieto.
      raf = Math.abs(tx - cx) + Math.abs(ty - cy) > 0.3 ? window.requestAnimationFrame(loop) : 0;
    };
    d.addEventListener('mousemove', function (e) {
      tx = e.clientX; ty = e.clientY;
      cursor.classList.remove('is-hidden');
      if (!raf) raf = window.requestAnimationFrame(loop);
    }, { passive: true });
    d.addEventListener('mouseleave', function () { cursor.classList.add('is-hidden'); });
    d.addEventListener('mouseover', function (e) {
      var t = e.target;
      var interactive = t.closest('a, button, summary, [data-cursor-hover]');
      cursor.classList.toggle('is-hidden', !!t.closest('input, textarea, select, iframe'));
      cursor.classList.toggle('is-hover', !!interactive);
      cursor.classList.toggle('is-text', !interactive && !!t.closest(TEXT));
    });
  }
})();
