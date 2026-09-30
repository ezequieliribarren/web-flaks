// Recursos gratuitos (/recursos y /recursos/:slug). El contenido vive en data/recursos/<slug>.json.
const fs = require('fs');
const path = require('path');
const express = require('express');
const seo = require('../lib/seo');
const { site } = require('../lib/content');

const router = express.Router();
const DIR = path.join(__dirname, '..', 'data', 'recursos');

const recursos = fs.existsSync(DIR)
  ? fs.readdirSync(DIR).filter((f) => f.endsWith('.json')).map((f) => JSON.parse(fs.readFileSync(path.join(DIR, f), 'utf8')))
  : [];
const bySlug = Object.fromEntries(recursos.map((r) => [r.slug, r]));
const fullTitle = (r) => `${r.title.text} ${r.title.accent} ${r.title.rest}`;

router.get('/recursos', (req, res) => {
  res.render('recursos', {
    title: 'Recursos gratuitos para vender más | FLAKS Agencia Digital',
    description: 'Guías y recursos gratuitos de FLAKS para vender más con tus redes, tu sitio web y tu tienda online.',
    pageKey: 'recursos',
    bodyClass: 'page-resource',
    isResource: true,
    recursos,
    fullTitle,
    styles: ['/css/recurso.css'],
  });
});

router.get('/recursos/:slug', (req, res, next) => {
  const r = bySlug[req.params.slug];
  if (!r) return next();
  const { siteUrl } = res.locals;
  const url = `${siteUrl}/recursos/${r.slug}`;
  const image = `${siteUrl}/img/og/recurso-${r.slug}.png`;
  res.render('recurso', {
    title: r.metaTitle,
    description: r.metaDescription,
    pageKey: 'recurso',
    bodyClass: 'page-resource',
    isResource: true,
    r,
    fullTitle,
    ogImage: image,
    waText: r.finalCta.waText,
    preloadImage: { src: res.locals.asset(`/img/recursos/${r.slug}/${r.cover}-600.webp`) },
    styles: ['/css/recurso.css'],
    scripts: ['/js/recurso.js'],
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: fullTitle(r),
        description: r.metaDescription,
        image: [image],
        datePublished: r.published,
        dateModified: r.updated,
        inLanguage: 'es-AR',
        mainEntityOfPage: url,
        author: { '@type': 'Organization', name: site.name, url: `${siteUrl}/` },
        publisher: { '@type': 'Organization', name: site.name, logo: { '@type': 'ImageObject', url: `${siteUrl}/img/brand/logo-icon.png` } },
      },
      seo.faqPage(r.faq),
    ],
  });
});

module.exports = router;
module.exports.recursos = recursos;
