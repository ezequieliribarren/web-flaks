/* FLAKS — Home: preloader, Lenis + GSAP/ScrollTrigger, paneles, carril de proyectos y lista agrupada. */
(function () {
  'use strict';

  var d = document;
  var root = d.documentElement;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasGsap = !!(window.gsap && window.ScrollTrigger);
  var $ = function (s, c) { return (c || d).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || d).querySelectorAll(s)); };
  var headerOffset = function () { return -((parseInt(getComputedStyle(root).getPropertyValue('--header-h'), 10) || 72) + 8); };
  var refresh = function () { if (hasGsap) window.ScrollTrigger.refresh(); };

  // Scroll a un elemento (con Lenis si está activo).
  function scrollToEl(el, immediate) {
    if (!el) return;
    var offset = el.matches('.svc') ? 0 : headerOffset();
    if (window.lenis) {
      window.lenis.scrollTo(el, { offset: offset, immediate: !!immediate, duration: 1.2 });
    } else {
      var y = el.getBoundingClientRect().top + window.scrollY + offset;
      window.scrollTo({ top: y, behavior: immediate || reduced ? 'auto' : 'smooth' });
    }
  }

  function handleHash(hash, immediate) {
    if (!hash || hash.length < 2) return false;
    var target;
    try { target = d.getElementById(decodeURIComponent(hash.slice(1))); } catch (e) { return false; }
    if (!target) return false;
    scrollToEl(target, immediate);
    return true;
  }

  // Links internos (#ancla o /#ancla) pasan por Lenis.
  d.addEventListener('click', function (e) {
    var a = e.target.closest('a[href*="#"]');
    if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey) return;
    var url = new URL(a.href, location.href);
    if (url.pathname !== location.pathname || !url.hash || url.hash === '#main') return;
    if (handleHash(url.hash, false)) {
      e.preventDefault();
      history.pushState(null, '', url.hash);
      var target = d.getElementById(url.hash.slice(1));
      if (target && !target.hasAttribute('tabindex') && !target.matches('a,button,input,select,textarea,summary')) target.setAttribute('tabindex', '-1');
      if (target) target.focus({ preventScroll: true });
    }
  });
  window.addEventListener('hashchange', function () { handleHash(location.hash, false); });

  /* =========================================================
     Lista agrupada de proyectos: "Ver los N restantes"
     ========================================================= */
  $$('[data-more]').forEach(function (btn) {
    var group = btn.closest('[data-group]');
    var label = $('[data-more-label]', btn);
    var closedText = label.textContent;
    btn.addEventListener('click', function () {
      var open = !group.classList.contains('is-open');
      group.classList.toggle('is-open', open);
      btn.setAttribute('aria-expanded', String(open));
      label.textContent = open ? 'Ver menos' : closedText;
      var extra = $$(window.innerWidth < 900 ? '.plist__item--more-m' : '.plist__item--more', group);
      if (open && hasGsap && !reduced) {
        window.gsap.fromTo(extra, { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 0.5, stagger: 0.06, ease: 'power3.out', clearProps: 'all' });
      }
      if (open && extra[0]) extra[0].querySelector('a').focus({ preventScroll: true });
      refresh();
    });
  });

  /* =========================================================
     Hero: preloader + revelado
     ========================================================= */
  var pre = $('[data-preloader]');
  var seen = false;
  try { seen = sessionStorage.getItem('flaks_pre') === '1'; } catch (e) { seen = true; }
  function revealHero() { root.classList.add('hero-ready'); }

  if (pre && hasGsap && !reduced && !seen && !location.hash) {
    try { sessionStorage.setItem('flaks_pre', '1'); } catch (e) { /* sin storage */ }
    pre.classList.add('is-active');
    var g = window.gsap;
    g.timeline({ defaults: { ease: 'power3.out' } })
      .fromTo($('.preloader__logo', pre), { clipPath: 'inset(0 100% 0 0)', x: -30 }, { clipPath: 'inset(0 0% 0 0)', x: 0, duration: 0.6, ease: 'power3.out' })
      .to($('.preloader__mark', pre), { x: 60, autoAlpha: 0, duration: 0.3, ease: 'power2.in' }, 0.75)
      .to(pre, { yPercent: -100, duration: 0.45, ease: 'power3.inOut' }, 0.8)
      .add(revealHero, 0.85)
      .add(function () { pre.remove(); });
  } else {
    if (pre) pre.remove();
    revealHero();
  }

  if (!hasGsap) {
    if (location.hash) handleHash(location.hash, true);
    return;
  }

  var gsap = window.gsap;
  var ScrollTrigger = window.ScrollTrigger;
  gsap.registerPlugin(ScrollTrigger);

  /* =========================================================
     Solapas laterales de servicios: visibles mientras su panel está en pantalla,
     y se van antes de que asome el servicio siguiente. (También con movimiento reducido.)
     ========================================================= */
  // Desarrollo Web: la solapa se abre con un toque y muestra Landing / Sitio / Tienda.
  function setTabOpen(tab, open) {
    var btn = $('[data-tab-toggle]', tab);
    if (!btn) return;
    btn.setAttribute('aria-expanded', String(open));
    $('.svc-tab__links', tab).hidden = !open;
    $('.svc-tab__hint', tab).firstChild.textContent = open ? 'Cerrar' : 'Ver opciones';
  }
  $$('[data-tab-toggle]').forEach(function (btn) {
    var tab = btn.closest('[data-svc-tab]');
    btn.addEventListener('click', function () { setTabOpen(tab, btn.getAttribute('aria-expanded') !== 'true'); });
    tab.addEventListener('keydown', function (e) { if (e.key === 'Escape') { setTabOpen(tab, false); btn.focus(); } });
  });

  $$('[data-svc-tab]').forEach(function (tab) {
    var panel = d.getElementById(tab.getAttribute('data-svc-tab'));
    if (!panel) return;
    ScrollTrigger.create({
      trigger: panel,
      // Desktop: el panel ocupa la pantalla; se oculta cuando asoma el siguiente.
      // Móvil: paneles más bajos que la pantalla; se usa una franja a media altura.
      start: function () { return window.innerWidth < 900 ? 'top 70%' : 'top 45%'; },
      end: function () { return window.innerWidth < 900 ? 'bottom 70%' : 'bottom bottom'; },
      invalidateOnRefresh: true,
      toggleClass: { targets: tab, className: 'is-visible' },
      refreshPriority: -1, // se calcula después de los pines de arriba (manifiesto, paneles)
      onToggle: function (self) { if (!self.isActive) setTabOpen(tab, false); },
    });
  });

  /* =========================================================
     Lenis (scroll suave) enganchado a ScrollTrigger
     ========================================================= */
  if (!reduced && window.Lenis) {
    var lenis = new window.Lenis({ lerp: 0.11, wheelMultiplier: 1, smoothWheel: true });
    window.lenis = lenis;
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
    gsap.ticker.lagSmoothing(0);
  }

  /* =========================================================
     Manifiesto: separar en palabras (siempre, para que el estilo sea igual)
     ========================================================= */
  var manifesto = $('[data-manifesto]');
  var words = [];
  if (manifesto) {
    var wrapWords = function (node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (child) {
        if (child.nodeType === 3) {
          var frag = d.createDocumentFragment();
          child.textContent.split(/(\s+)/).forEach(function (part) {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(d.createTextNode(' ')); return; }
            var s = d.createElement('span');
            s.className = 'w';
            s.textContent = part;
            frag.appendChild(s);
            words.push(s);
          });
          child.parentNode.replaceChild(frag, child);
        } else if (child.nodeType === 1) {
          wrapWords(child);
        }
      });
    };
    wrapWords(manifesto);
  }

  /* Carril de proyectos: referencias (antes de matchMedia, que corre sincrónico) */
  var rail = $('[data-rail]');
  var viewport = $('[data-rail-viewport]');
  var track = $('[data-rail-track]');
  var progress = $('[data-rail-progress]');
  var counter = $('[data-rail-counter]');
  var items = $$('.rail__track > li');
  var cards = $$('[data-card]');
  var total = counter ? counter.getAttribute('data-total') : '';
  var lastIndex = -1;
  var lastGlow = '';

  var mm = gsap.matchMedia();

  mm.add(
    {
      desktop: '(min-width: 900px)',
      mobile: '(max-width: 899px)',
      motion: '(prefers-reduced-motion: no-preference)',
    },
    function (ctx) {
      var c = ctx.conditions;
      if (!c.motion) {
        // Sin movimiento: todo visible, sin pines ni parallax.
        gsap.set(words, { opacity: 1 });
        return setupRailNative();
      }

      /* ---------- Hero: rayas que aceleran con la velocidad del scroll ---------- */
      var hero = $('.hero');
      var rays = $$('.ray');
      var anims = [];
      rays.forEach(function (r) { if (r.getAnimations) anims = anims.concat(r.getAnimations()); });
      var speed = { current: 1, target: 1 };
      var heroST = ScrollTrigger.create({
        trigger: hero,
        start: 'top top',
        end: 'bottom top',
        onUpdate: function (self) {
          speed.target = 1 + Math.min(Math.abs(self.getVelocity()) / 220, 9);
        },
      });
      var tick = function () {
        speed.target += (1 - speed.target) * 0.04;
        speed.current += (speed.target - speed.current) * 0.12;
        for (var i = 0; i < anims.length; i++) anims[i].playbackRate = speed.current;
      };
      gsap.ticker.add(tick);

      gsap.to('.hero__inner', {
        yPercent: -12,
        autoAlpha: 0.2,
        ease: 'none',
        scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true },
      });
      gsap.to('.hero__rays', {
        xPercent: -8,
        ease: 'none',
        scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true },
      });

      /* ---------- Manifiesto: palabra por palabra ---------- */
      if (manifesto) {
        gsap.set(words, { opacity: 0.45 }); // 0,45 mantiene 3:1 de contraste (texto grande) antes de iluminarse
        gsap.to(words, {
          opacity: 1,
          stagger: 0.1,
          ease: 'none',
          scrollTrigger: c.desktop
            ? { trigger: '.manifesto', start: 'top top', end: '+=130%', pin: true, scrub: 0.6, anticipatePin: 1 }
            : { trigger: manifesto, start: 'top 80%', end: 'bottom 45%', scrub: 0.6 },
        });
      }

      /* ---------- Servicios: paneles apilados ---------- */
      $$('.svc').forEach(function (svc, i, all) {
        var stage = $('[data-stage]', svc);
        var grid = $('.svc__grid', stage);
        var num = $('.svc__num', stage);

        gsap.from([num], {
          xPercent: -18,
          autoAlpha: 0,
          duration: 1.1,
          ease: 'power3.out',
          scrollTrigger: { trigger: stage, start: 'top 70%' },
        });
        gsap.from($$('.svc__body > *', stage), {
          y: 36,
          autoAlpha: 0,
          duration: 0.9,
          stagger: 0.07,
          ease: 'power3.out',
          scrollTrigger: { trigger: stage, start: 'top 65%' },
        });

        // Pin solo si el panel entra completo en la pantalla (en pantallas bajas se scrollea normal).
        var fits = stage.offsetHeight <= window.innerHeight + 2;
        if (c.desktop && fits) {
          ScrollTrigger.create({
            trigger: svc,
            start: 'top top',
            end: 'bottom top',
            pin: stage,
            pinSpacing: false,
            anticipatePin: 1,
            invalidateOnRefresh: true,
          });
          // El panel tapado se achica y se apaga mientras el siguiente sube encima.
          {
            gsap.to(grid, {
              scale: 0.9,
              autoAlpha: 0.25,
              ease: 'none',
              scrollTrigger: {
                trigger: svc,
                start: function () { return 'bottom-=' + window.innerHeight + ' top'; },
                end: 'bottom top',
                scrub: true,
                invalidateOnRefresh: true,
              },
            });
          }
          gsap.to(num, {
            yPercent: 25,
            ease: 'none',
            scrollTrigger: { trigger: svc, start: 'top top', end: 'bottom top', scrub: true },
          });
        }
      });

      /* ---------- Proyectos ---------- */
      var railCleanup = c.desktop ? setupRailPinned() : setupRailNative();

      /* ---------- Proceso: línea que se dibuja ---------- */
      var line = $('[data-steps-line]');
      if (line) {
        gsap.fromTo(line, c.desktop ? { scaleX: 0 } : { scaleY: 0 }, {
          scaleX: 1,
          scaleY: 1,
          ease: 'none',
          scrollTrigger: { trigger: '[data-steps]', start: 'top 75%', end: 'bottom 55%', scrub: true },
        });
        gsap.from('[data-step]', {
          y: 40,
          autoAlpha: 0,
          stagger: 0.15,
          duration: 0.9,
          ease: 'power3.out',
          scrollTrigger: { trigger: '[data-steps]', start: 'top 75%' },
        });
      }

      /* ---------- Títulos de sección ---------- */
      $$('.work__head, .process .section-head, .contact__head, .services__head, .reviews__head').forEach(function (el) {
        gsap.from(el.children, {
          y: 50,
          autoAlpha: 0,
          duration: 1,
          stagger: 0.08,
          ease: 'power3.out',
          scrollTrigger: { trigger: el, start: 'top 80%' },
        });
      });

      return function () {
        gsap.ticker.remove(tick);
        if (railCleanup) railCleanup();
        heroST.kill();
        anims.forEach(function (a) { a.playbackRate = 1; });
      };
    }
  );

  /* =========================================================
     Carril de proyectos
     ========================================================= */

  function hexToRgba(hex, a) {
    var n = parseInt(hex.replace('#', ''), 16);
    return 'rgba(' + ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')';
  }

  // Actualiza HUD según el punto del carril que está en el centro de la pantalla.
  function updateHud(offset, p) {
    if (progress) progress.style.transform = 'scaleX(' + Math.max(0, Math.min(1, p)) + ')';
    var center = offset + window.innerWidth * 0.5;
    var active = items[0];
    for (var i = 0; i < items.length; i++) {
      if (items[i].offsetLeft <= center) active = items[i];
    }
    var glow = active && active.getAttribute('data-glow');
    if (glow && glow !== lastGlow && rail) {
      lastGlow = glow;
      rail.style.setProperty('--rail-glow', hexToRgba(glow, 0.24));
    }
    var card = active && active.hasAttribute('data-card') ? active : null;
    if (!card) {
      // En un panel-título: mostramos el primer proyecto del capítulo.
      var idx = items.indexOf(active);
      for (var j = idx; j < items.length; j++) { if (items[j].hasAttribute('data-card')) { card = items[j]; break; } }
      if (!card) card = cards[cards.length - 1];
    }
    var num = card ? Number(card.getAttribute('data-num')) : 1;
    if (num !== lastIndex && counter) {
      lastIndex = num;
      counter.textContent = (num < 10 ? '0' : '') + num + ' / ' + total;
    }
  }

  function setupRailPinned() {
    if (!rail || !track) return;
    rail.classList.add('is-pinned');
    viewport.scrollLeft = 0;
    var dist = function () { return Math.max(0, track.scrollWidth - window.innerWidth); };

    var tween = gsap.to(track, {
      x: function () { return -dist(); },
      ease: 'none',
      scrollTrigger: {
        trigger: rail,
        start: 'top top',
        end: function () { return '+=' + dist(); },
        pin: true,
        scrub: 0.8,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onUpdate: function (self) { updateHud(self.progress * dist(), self.progress); },
      },
    });

    // Parallax entre la captura principal y la superpuesta.
    cards.forEach(function (card) {
      var main = $('.pcard__main img', card);
      var float = $('.pcard__float', card);
      if (float) {
        gsap.fromTo(float, { x: 70, y: 20 }, {
          x: -40, y: -10, ease: 'none',
          scrollTrigger: { trigger: card, containerAnimation: tween, start: 'left right', end: 'right left', scrub: true },
        });
      }
      if (main) {
        gsap.fromTo(main, { xPercent: -3 }, {
          xPercent: 3, ease: 'none',
          scrollTrigger: { trigger: card, containerAnimation: tween, start: 'left right', end: 'right left', scrub: true },
        });
      }
    });
    $$('.chapter', track).forEach(function (ch) {
      gsap.from(ch.children, {
        x: 80, autoAlpha: 0, stagger: 0.06, ease: 'power2.out',
        scrollTrigger: { trigger: ch, containerAnimation: tween, start: 'left 85%', end: 'left 45%', scrub: true },
      });
    });

    // Teclado: al enfocar algo dentro de una tarjeta, llevamos el scroll vertical hasta ella.
    var onFocus = function (e) {
      var item = e.target.closest('.rail__track > li');
      if (!item) return;
      var st = tween.scrollTrigger;
      var x = Math.max(0, Math.min(dist(), item.offsetLeft - (window.innerWidth - item.offsetWidth) / 2));
      var y = st.start + (dist() ? (x / dist()) * (st.end - st.start) : 0);
      viewport.scrollLeft = 0;
      if (window.lenis) window.lenis.scrollTo(y, { immediate: true }); else window.scrollTo(0, y);
    };
    var onKey = function (e) {
      if (e.target !== viewport || (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft')) return;
      e.preventDefault();
      var st = tween.scrollTrigger;
      var step = (st.end - st.start) / Math.max(1, items.length - 1);
      var y = window.scrollY + (e.key === 'ArrowRight' ? step : -step);
      if (window.lenis) window.lenis.scrollTo(y); else window.scrollTo(0, y);
    };
    viewport.addEventListener('focusin', onFocus);
    viewport.addEventListener('keydown', onKey);

    return function () {
      rail.classList.remove('is-pinned');
      viewport.removeEventListener('focusin', onFocus);
      viewport.removeEventListener('keydown', onKey);
    };
  }

  function setupRailNative() {
    if (!rail || !viewport) return;
    rail.classList.remove('is-pinned');
    gsap.set(track, { clearProps: 'transform' });
    var onScroll = function () {
      var max = viewport.scrollWidth - viewport.clientWidth;
      updateHud(viewport.scrollLeft, max ? viewport.scrollLeft / max : 0);
    };
    viewport.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return function () { viewport.removeEventListener('scroll', onScroll); };
  }

  /* =========================================================
     Lista "Todos los proyectos": preview que sigue al cursor
     ========================================================= */
  var preview = $('[data-plist-preview]');
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (preview && fine) {
    var img = $('img', preview);
    var xTo = gsap.quickTo(preview, 'x', { duration: 0.5, ease: 'power3' });
    var yTo = gsap.quickTo(preview, 'y', { duration: 0.5, ease: 'power3' });
    gsap.set(preview, { xPercent: -50, yPercent: -50, x: window.innerWidth / 2, y: window.innerHeight / 2 });
    $$('[data-preview]').forEach(function (row) {
      row.addEventListener('mouseenter', function () {
        var src = row.getAttribute('data-preview');
        if (img.getAttribute('src') !== src) img.setAttribute('src', src);
        preview.classList.add('is-visible');
      });
      row.addEventListener('mouseleave', function () { preview.classList.remove('is-visible'); });
    });
    var list = $('[data-plist]');
    list.addEventListener('mousemove', function (e) { xTo(e.clientX + 40); yTo(e.clientY); });
  }

  /* =========================================================
     Recalcular posiciones cuando cargan fuentes e imágenes
     ========================================================= */
  if (d.fonts && d.fonts.ready) d.fonts.ready.then(refresh);
  window.addEventListener('load', function () {
    refresh();
    if (location.hash) setTimeout(function () { handleHash(location.hash, true); }, 60);
  });
  $$('.rail img, .svc img').forEach(function (im) { if (!im.complete) im.addEventListener('load', refresh, { once: true }); });
})();
