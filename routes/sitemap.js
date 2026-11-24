// robots.txt y sitemap.xml generados por Express.
const fs = require('fs');
const path = require('path');
const express = require('express');

const { posts } = require('./blog');

const router = express.Router();
const root = path.join(__dirname, '..');
const mtime = (...files) =>
  new Date(Math.max(...files.map((f) => {
    try { return fs.statSync(path.join(root, f)).mtimeMs; } catch { return 0; }
  }))).toISOString().slice(0, 10);

const urls = [
  { loc: '/', files: ['views/home.ejs', 'data/projects.json', 'data/services.json'], changefreq: 'weekly', priority: '1.0' },
  { loc: '/landing-page', files: ['views/service.ejs', 'data/services.json', 'data/faq.json'], changefreq: 'monthly', priority: '0.9' },
  { loc: '/sitio-web', files: ['views/service.ejs', 'data/services.json', 'data/faq.json'], changefreq: 'monthly', priority: '0.9' },
  { loc: '/tienda-digital', files: ['views/service.ejs', 'data/services.json', 'data/faq.json'], changefreq: 'monthly', priority: '0.9' },
  { loc: '/redes-sociales', files: ['views/service.ejs', 'data/services.json', 'data/faq.json'], changefreq: 'monthly', priority: '0.8' },
  { loc: '/pauta-publicitaria', files: ['views/service.ejs', 'data/services.json', 'data/faq.json'], changefreq: 'monthly', priority: '0.8' },
  { loc: '/recursos', files: ['views/recursos.ejs'], changefreq: 'monthly', priority: '0.6' },
  { loc: '/recursos/15-ganchos', files: ['views/recurso.ejs', 'data/recursos/15-ganchos.json'], changefreq: 'monthly', priority: '0.7' },
  { loc: '/privacidad', files: ['views/privacidad.ejs'], changefreq: 'yearly', priority: '0.3' },
];

router.get('/sitemap.xml', (req, res) => {
  const base = res.locals.siteUrl;
  const latest = posts.map((p) => p.updated).sort().pop();
  const blogEntries = [
    ...(posts.length ? [`  <url>\n    <loc>${base}/blog</loc>\n    <lastmod>${latest}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.7</priority>\n  </url>`] : []),
    ...posts.map((p) => `  <url>\n    <loc>${base}/blog/${p.slug}</loc>\n    <lastmod>${p.updated}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.7</priority>\n  </url>`),
  ];
  const body = [...urls
    .map((u) => `  <url>\n    <loc>${base}${u.loc}</loc>\n    <lastmod>${mtime(...u.files)}</lastmod>\n    <changefreq>${u.changefreq}</changefreq>\n    <priority>${u.priority}</priority>\n  </url>`)
    , ...blogEntries].join('\n');
  res.type('application/xml').set('Cache-Control', 'public, max-age=3600')
    .send(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`);
});

router.get('/robots.txt', (req, res) => {
  res.type('text/plain').set('Cache-Control', 'public, max-age=3600').send(
    `User-agent: *\nAllow: /\nDisallow: /api/\n\nSitemap: ${res.locals.siteUrl}/sitemap.xml\n`
  );
});

module.exports = router;
