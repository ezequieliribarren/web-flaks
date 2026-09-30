const express = require('express');
const { site, services, faq, projects, chapters, reviews, social, projectsForPage } = require('../lib/content');
const seo = require('../lib/seo');

const router = express.Router();

router.get('/', (req, res) => {
  const { siteUrl, whatsapp } = res.locals;
  res.render('home', {
    title: site.home.metaTitle,
    description: site.home.metaDescription,
    pageKey: 'home',
    bodyClass: 'page-home',
    panels: services.panels,
    servicePages: services.pages,
    projects,
    chapters,
    reviews,
    styles: ['/css/home.css'],
    scripts: ['/vendor/gsap.min.js', '/vendor/ScrollTrigger.min.js', '/vendor/lenis.min.js', '/js/home.js'],
    jsonLd: [seo.organization(siteUrl, whatsapp)],
  });
});

for (const slug of Object.keys(services.pages)) {
  router.get(`/${slug}`, (req, res) => {
    const { siteUrl, whatsapp } = res.locals;
    const page = services.pages[slug];
    const others = Object.values(services.pages).filter((p) => p.slug !== slug);
    const portfolio = projectsForPage(slug);

    // La captura del hero es el LCP: se precarga con el mismo srcset que usa el <img>.
    const { exists, asset } = res.locals;
    const lead = portfolio[0];
    let preloadImage = null;
    if (lead && exists(lead.images.hero)) {
      const small = lead.images.hero.replace(/\.webp$/, '-800.webp');
      preloadImage = exists(small)
        ? { src: asset(lead.images.hero), srcset: `${asset(small)} 800w, ${asset(lead.images.hero)} 1440w`, sizes: '(min-width: 900px) 50vw, 92vw' }
        : { src: asset(lead.images.hero) };
    }

    res.render('service', {
      preloadImage,
      title: page.metaTitle,
      description: page.metaDescription,
      pageKey: slug,
      bodyClass: `page-service page-${slug}`,
      isService: true,
      page,
      others,
      waText: `Hola FLAKS! Quiero consultar por ${page.name.toLowerCase()}.`,
      faqItems: faq[slug],
      portfolio,
      // Sufijo de las clases gtm-* (mismo que en el sitio actual: lp / sw / td).
      gtmCode: { 'landing-page': 'lp', 'sitio-web': 'sw', 'tienda-digital': 'td', 'redes-sociales': 'rs', 'pauta-publicitaria': 'pp' }[slug],
      social: page.showcase ? social : [],
      ogImage: `${siteUrl}/img/og/${slug}.png`,
      styles: ['/css/service.css'],
      scripts: ['/js/service.js'],
      jsonLd: [
        seo.organization(siteUrl, whatsapp),
        seo.service(siteUrl, page),
        seo.faqPage(faq[slug]),
      ],
    });
  });
}

router.get('/privacidad', (req, res) => {
  res.render('privacidad', {
    title: 'Política de privacidad | FLAKS Agencia Digital',
    description: 'Cómo FLAKS trata los datos que nos enviás a través del sitio y del formulario de contacto.',
    pageKey: 'privacidad',
    bodyClass: 'page-legal',
  });
});

module.exports = router;
