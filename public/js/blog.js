/* FLAKS — blog: mide cuánto se lee cada guía (25/50/75/100 %) para el dataLayer. */
(function () {
  'use strict';
  var art = document.querySelector('[data-article]');
  var body = document.querySelector('.blog-body');
  if (!art || !body) return;
  var dl = function (o) { (window.dataLayer = window.dataLayer || []).push(o); };
  var slug = art.getAttribute('data-article');
  var service = art.getAttribute('data-article-service');
  var marks = [25, 50, 75, 100];
  var sent = {};
  var ticking = false;

  function check() {
    ticking = false;
    var r = body.getBoundingClientRect();
    var total = r.height - window.innerHeight * 0.5;
    if (total <= 0) return;
    var pct = Math.min(100, Math.max(0, ((window.innerHeight * 0.5 - r.top) / total) * 100));
    marks.forEach(function (m) {
      if (pct >= m && !sent[m]) {
        sent[m] = true;
        dl({ event: 'article_progress', percent: m, article_slug: slug, article_service: service, page_path: location.pathname });
      }
    });
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; window.requestAnimationFrame(check); }
  }, { passive: true });
  check();
})();
