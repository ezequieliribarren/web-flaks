// Blog / guías (/blog y /blog/:slug). Cada artículo es un JSON en data/blog/<slug>.json.
// En producción solo se publican los que no tienen "published": false.
const fs = require('fs');
const path = require('path');
const express = require('express');
const seo = require('../lib/seo');
const { recursos } = require('./recursos');
const { site, services } = require('../lib/content');

const router = express.Router();
const DIR = path.join(__dirname, '..', 'data', 'blog');
const isProd = process.env.NODE_ENV === 'production';

const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ESC[c]);

// Texto con formato mínimo: **negrita** y [texto](/ruta o https://…). Todo lo demás se escapa.
function md(text) {
  return esc(text)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\[([^\]]+)\]\((\/[^)\s]*|https:\/\/[^)\s]+)\)/g, (m, label, url) => {
      const external = url.startsWith('http');
      return `<a href="${url}"${external ? ' target="_blank" rel="noopener"' : ''}>${label}</a>`;
    });
}
const plain = (text) => String(text).replace(/\*\*(.+?)\*\*/g, '$1').replace(/\[([^\]]+)\]\([^)]*\)/g, '$1');

function wordsOf(post) {
  const parts = [post.answer || '', post.intro || ''];
  (post.sections || []).forEach((s) => {
    parts.push(s.h2);
    (s.blocks || []).forEach((b) => {
      if (typeof b === 'string') parts.push(b);
      else if (b.ul || b.ol) parts.push((b.ul || b.ol).join(' '));
      else if (b.table) parts.push(b.table.rows.map((r) => r.join(' ')).join(' '));
      else if (b.tip) parts.push(b.tip);
      else if (b.h3) parts.push(b.h3);
    });
  });
  (post.faq || []).forEach((f) => parts.push(f.q, f.a));
  return plain(parts.join(' ')).split(/\s+/).filter(Boolean).length;
}

const all = fs.existsSync(DIR)
  ? fs.readdirSync(DIR).filter((f) => f.endsWith('.json')).map((f) => {
      const post = JSON.parse(fs.readFileSync(path.join(DIR, f), 'utf8'));
      post.readMinutes = Math.max(2, Math.round(wordsOf(post) / 200));
      return post;
    })
  : [];

const visible = (p) => p.published !== false || !isProd;
const posts = all.filter(visible).sort((a, b) => (b.updated || '').localeCompare(a.updated || ''));
const bySlug = Object.fromEntries(posts.map((p) => [p.slug, p]));
const serviceName = (slug) => (services.pages[slug] ? services.pages[slug].name : 'Marketing digital');

const fmtDate = (iso) => new Date(`${iso}T12:00:00`).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' });

router.get('/blog', (req, res) => {
  res.render('blog-index', {
    title: 'Blog de marketing digital para pymes | FLAKS',
    description: 'Guías prácticas de FLAKS sobre páginas web, landing pages, tiendas online, redes sociales y publicidad en Google y Meta, escritas para negocios de Argentina.',
    pageKey: 'blog',
    bodyClass: 'page-resource page-blog',
    isResource: true,
    recursos,
    fullTitle: (x) => `${x.title.text} ${x.title.accent} ${x.title.rest}`,
    posts,
    serviceName,
    fmtDate,
    styles: ['/css/recurso.css', '/css/blog.css'],
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'Blog',
        name: 'Blog de FLAKS',
        url: `${res.locals.siteUrl}/blog`,
        inLanguage: 'es-AR',
        publisher: { '@id': `${res.locals.siteUrl}/#organization` },
        blogPost: posts.filter((p) => p.published !== false).map((p) => ({ '@type': 'BlogPosting', headline: p.title, url: `${res.locals.siteUrl}/blog/${p.slug}` })),
      },
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Inicio', item: `${res.locals.siteUrl}/` },
          { '@type': 'ListItem', position: 2, name: 'Blog', item: `${res.locals.siteUrl}/blog` },
        ],
      },
    ],
  });
});

router.get('/blog/:slug', (req, res, next) => {
  const post = bySlug[req.params.slug];
  if (!post) return next();
  const { siteUrl } = res.locals;
  const url = `${siteUrl}/blog/${post.slug}`;
  const related = [
    ...posts.filter((p) => p.slug !== post.slug && p.service === post.service),
    ...posts.filter((p) => p.slug !== post.slug && p.service !== post.service),
  ].filter((p) => p.published !== false).slice(0, 3);
  const svc = services.pages[post.service];
  const draft = post.published === false;

  res.render('blog-post', {
    title: post.metaTitle || `${post.title} | FLAKS`,
    description: post.metaDescription,
    robots: draft ? 'noindex,nofollow' : 'index,follow',
    pageKey: 'blog-post',
    bodyClass: 'page-resource page-blog page-blog-post',
    isResource: true,
    post,
    related,
    svc,
    serviceName,
    fmtDate,
    md,
    draft,
    waTextMid: post.ctaText || `Hola FLAKS! Leí la guía "${post.title}" y quiero consultar.`,
    styles: ['/css/recurso.css', '/css/blog.css'],
    scripts: ['/js/blog.js'],
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: post.title,
        description: post.metaDescription,
        image: [`${siteUrl}/img/og/home.png`],
        datePublished: post.published_at || post.updated,
        dateModified: post.updated,
        inLanguage: 'es-AR',
        mainEntityOfPage: { '@type': 'WebPage', '@id': url },
        author: { '@type': 'Organization', name: site.name, url: `${siteUrl}/` },
        publisher: { '@id': `${siteUrl}/#organization` },
        articleSection: serviceName(post.service),
        keywords: (post.keywords || []).join(', '),
        wordCount: wordsOf(post),
      },
      seo.faqPage(post.faq || []),
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Inicio', item: `${siteUrl}/` },
          { '@type': 'ListItem', position: 2, name: 'Blog', item: `${siteUrl}/blog` },
          { '@type': 'ListItem', position: 3, name: post.title, item: url },
        ],
      },
    ],
  });
});

module.exports = router;
module.exports.posts = posts.filter((p) => p.published !== false);
