require('dotenv').config();

const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const express = require('express');
const helmet = require('helmet');
const compression = require('compression');
const expressLayouts = require('express-ejs-layouts');

const { site } = require('./lib/content');
const { toJsonLd } = require('./lib/seo');

const app = express();
const PORT = process.env.PORT || 3000;
const SITE_URL = (process.env.SITE_URL || 'https://flaks.com.ar').replace(/\/$/, '');
// wa.me solo acepta dígitos: se limpia el valor por si en el panel se cargó como "+54 9 11 5745-5803".
const WHATSAPP = String(process.env.WHATSAPP_NUMBER || '').replace(/\D/g, '') || '5491157455803';
// Vacío en .env = sin GTM (desarrollo). Sin definir = contenedor de producción.
const GTM_ID = process.env.GTM_ID ?? 'GTM-TWHGP8NC';
const PUBLIC = path.join(__dirname, 'public');

app.set('trust proxy', 1);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.set('layout', 'layout');
app.disable('x-powered-by');

// 1) Host canónico (www <-> apex), antes que nada.
app.use(require('./routes/host')(process.env.CANONICAL_HOST));

// 2) Redirects 301 desde data/redirects.json.
app.use(require('./routes/redirects'));

// 3) Seguridad: CSP con nonce por request + 'strict-dynamic' para que GTM pueda cargar sus tags.
app.use((req, res, next) => {
  res.locals.nonce = crypto.randomBytes(16).toString('base64');
  next();
});
app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: false,
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", (req, res) => `'nonce-${res.locals.nonce}'`, "'strict-dynamic'", 'https:', "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://www.googletagmanager.com', 'https://fonts.googleapis.com'],
        imgSrc: ["'self'", 'data:', 'https:'],
        fontSrc: ["'self'", 'data:', 'https://fonts.gstatic.com'],
        connectSrc: ["'self'", 'https:'],
        frameSrc: ["'self'", 'https://www.googletagmanager.com', 'https://td.doubleclick.net', 'https://www.facebook.com', 'https://calendly.com', 'https://www.youtube-nocookie.com', 'https://www.youtube.com', 'https://player.vimeo.com'],
        mediaSrc: ["'self'", 'https:'],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        frameAncestors: ["'self'"],
        upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null,
      },
    },
    // YouTube/Vimeo necesitan el origen para reproducir embebido (con no-referrer dan error 153).
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'same-site' },
  })
);
app.use(compression());

// 4) Estáticos. Con ?v=hash se cachean un año (immutable); sin versión, 1 hora.
app.use(
  express.static(PUBLIC, {
    index: false,
    setHeaders(res, filePath) {
      // Fuentes: nombre estable, se cachean un año (si cambian, renombrar el archivo).
      const versioned = (res.req && res.req.query && res.req.query.v) || /[\\/]fonts[\\/]/.test(filePath);
      res.setHeader('Cache-Control', versioned ? 'public, max-age=31536000, immutable' : 'public, max-age=3600');
    },
  })
);

// Helper de assets versionados por hash de contenido (se calcula una vez por archivo).
const assetCache = new Map();
function asset(p) {
  if (!assetCache.has(p) || process.env.NODE_ENV !== 'production') {
    try {
      const buf = fs.readFileSync(path.join(PUBLIC, p));
      assetCache.set(p, `${p}?v=${crypto.createHash('md5').update(buf).digest('hex').slice(0, 10)}`);
    } catch {
      assetCache.set(p, p);
    }
  }
  return assetCache.get(p);
}
const exists = (p) => fs.existsSync(path.join(PUBLIC, p));

// Locals comunes a todas las vistas.
app.use(expressLayouts);
app.use((req, res, next) => {
  const wa = (text = site.whatsappMessage) => `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(text)}`;
  const cleanPath = req.path.length > 1 ? req.path.replace(/\/+$/, '') : '/';
  Object.assign(res.locals, {
    site,
    siteUrl: SITE_URL,
    whatsapp: WHATSAPP,
    wa,
    waText: site.whatsappMessage,
    toJsonLd,
    gtmId: GTM_ID,
    clarityId: process.env.CLARITY_ID || '',
    isProd: process.env.NODE_ENV === 'production',
    bookingUrl: process.env.BOOKING_URL || site.bookingUrl || wa('Hola FLAKS! Quiero agendar una llamada.'),
    gtmCode: '',
    asset,
    exists,
    currentPath: cleanPath,
    canonical: `${SITE_URL}${cleanPath === '/' ? '/' : cleanPath}`,
    robots: 'index,follow',
    ogImage: `${SITE_URL}/img/og/home.png`,
    jsonLd: [],
    styles: [],
    scripts: [],
    bodyClass: '',
    pageKey: '',
  });
  next();
});

// 5) Rutas.
app.use(require('./routes/sitemap'));
app.use(require('./routes/contact'));
app.use(require('./routes/pages'));
app.use(require('./routes/recursos'));

// 6) 404 y errores.
app.use((req, res) => {
  res.status(404).render('404', {
    title: 'Página no encontrada | FLAKS',
    description: 'La página que buscás no existe. Mirá nuestros servicios o escribinos por WhatsApp.',
    robots: 'noindex,follow',
    canonical: null,
    bodyClass: 'page-404',
  });
});
app.use((err, req, res, next) => {
  console.error(err);
  if (res.headersSent) return next(err);
  res.status(500).render('404', {
    title: 'Algo salió mal | FLAKS',
    description: 'Tuvimos un problema. Probá de nuevo en unos minutos.',
    robots: 'noindex,follow',
    canonical: null,
    bodyClass: 'page-404',
    is500: true,
  });
});

app.listen(PORT, () => {
  console.log(`FLAKS escuchando en http://localhost:${PORT}`);
});
