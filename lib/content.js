// Carga y prepara el contenido de /data. Se lee una sola vez al arrancar.
const fs = require('fs');
const path = require('path');

const DATA = path.join(__dirname, '..', 'data');
const read = (file) => JSON.parse(fs.readFileSync(path.join(DATA, file), 'utf8'));

const site = read('site.json');
const services = read('services.json');
const faqRaw = read('faq.json');
const redirects = read('redirects.json');
const allProjects = read('projects.json');
const allReviews = read('reviews.json');
const social = read('social.json');

// Solo proyectos habilitados, renumerados en orden para que "01 / 16" siempre cierre.
const projects = allProjects
  .filter((p) => p.enabled)
  .map((p, i) => ({ ...p, num: i + 1 }));
const total = projects.length;
const pad = (n) => String(n).padStart(2, '0');
projects.forEach((p) => { p.numLabel = `${pad(p.num)} / ${pad(total)}`; });

// Plazos: un único valor por servicio (services.json), inyectado en el FAQ con {plazo}.
const plazos = Object.fromEntries(
  Object.entries(services.pages).map(([slug, s]) => [slug, s.delivery])
);
const faq = Object.fromEntries(
  Object.entries(faqRaw).map(([key, items]) => [
    key,
    items.map((it) => {
      const plazo = plazos[key] || '';
      const a = it.a.replace('{plazo}', plazo);
      return { ...it, a: a.charAt(0).toUpperCase() + a.slice(1) };
    }),
  ])
);

// Carril de proyectos: un destacado por capítulo (el primero con featured: true).
// La lista "Todos los proyectos" usa los mismos capítulos, con todos sus proyectos.
const RAIL_PER_CHAPTER = 1;
const chapters = services.chapters.map((c) => {
  const inChapter = projects.filter((p) => p.chapter === c.key);
  return {
    ...c,
    count: inChapter.length,
    projects: inChapter,
    featured: inChapter.filter((p) => p.featured).slice(0, RAIL_PER_CHAPTER),
  };
});

// Reseñas: en producción solo se publican las verificadas (textos reales, aprobados
// por el cliente o tomados de Google). Las de ejemplo se ven únicamente en desarrollo.
const bySlug = Object.fromEntries(projects.map((p) => [p.slug, p]));
const reviews = allReviews
  .filter((r) => r.verified || process.env.NODE_ENV !== 'production')
  .map((r) => ({ ...r, project: bySlug[r.project] || null }));

const projectsForPage = (slug) => projects.filter((p) => p.pages.includes(slug));

module.exports = { site, services, faq, redirects, projects, chapters, reviews, social, projectsForPage, total, pad };
