// robots.txt y sitemap.xml generados por Express.
const fs = require('fs');
const path = require('path');
const express = require('express');
const { redirects } = require('../lib/content');

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
  { loc: '/privacidad', files: ['views/privacidad.ejs'], changefreq: 'yearly', priority: '0.3' },
];

router.get('/sitemap.xml', (req, res) => {
  const base = res.locals.siteUrl;
  const body = urls
    .map((u) => `  <url>\n    <loc>${base}${u.loc}</loc>\n    <lastmod>${mtime(...u.files)}</lastmod>\n    <changefreq>${u.changefreq}</changefreq>\n    <priority>${u.priority}</priority>\n  </url>`)
    .join('\n');
  res.type('application/xml').set('Cache-Control', 'public, max-age=3600')
    .send(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`);
});

router.get('/robots.txt', (req, res) => {
  const disallow = Object.keys(redirects).map((from) => `Disallow: ${from}`).join('\n');
  res.type('text/plain').set('Cache-Control', 'public, max-age=3600').send(
    `User-agent: *\nAllow: /\n${disallow}\nDisallow: /api/\n\nSitemap: ${res.locals.siteUrl}/sitemap.xml\n`
  );
});

module.exports = router;
