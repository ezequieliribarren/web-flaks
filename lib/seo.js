// Datos estructurados JSON-LD.
const { site } = require('./content');

function organization(siteUrl, whatsapp) {
  return {
    '@context': 'https://schema.org',
    '@type': ['Organization', 'LocalBusiness'],
    '@id': `${siteUrl}/#organization`,
    name: site.name,
    legalName: site.legalName,
    url: `${siteUrl}/`,
    logo: `${siteUrl}/img/brand/logo-icon.png`,
    image: `${siteUrl}/img/og/home.png`,
    email: site.email,
    telephone: `+${whatsapp}`,
    address: {
      '@type': 'PostalAddress',
      addressLocality: site.city,
      addressRegion: site.region,
      addressCountry: site.country,
    },
    areaServed: { '@type': 'Country', name: site.countryName },
    sameAs: [site.instagram],
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: `+${whatsapp}`,
      contactType: 'sales',
      areaServed: site.country,
      availableLanguage: 'es',
    },
  };
}

function service(siteUrl, page) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: page.name,
    serviceType: page.serviceType,
    description: page.metaDescription,
    url: `${siteUrl}/${page.slug}`,
    provider: { '@id': `${siteUrl}/#organization`, '@type': 'Organization', name: site.name, url: `${siteUrl}/` },
    areaServed: { '@type': 'Country', name: site.countryName },
  };
}

function faqPage(items) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((it) => ({
      '@type': 'Question',
      name: it.q,
      acceptedAnswer: { '@type': 'Answer', text: it.a },
    })),
  };
}

function breadcrumb(siteUrl, page) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Inicio', item: `${siteUrl}/` },
      { '@type': 'ListItem', position: 2, name: page.name, item: `${siteUrl}/${page.slug}` },
    ],
  };
}

// Serializa sin romper el <script> (escapa "<").
const toJsonLd = (obj) => JSON.stringify(obj).replace(/</g, '\u003c');

module.exports = { organization, service, faqPage, breadcrumb, toJsonLd };
