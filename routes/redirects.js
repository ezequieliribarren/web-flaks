// Redirects 301 definidos en data/redirects.json (origen -> destino).
// Acepta el origen con o sin barra final. La parte "#ancla" de la URL vieja nunca llega
// al servidor, así que el destino define el ancla.
const { redirects } = require('../lib/content');

const table = new Map(
  Object.entries(redirects).map(([from, to]) => [from.replace(/\/+$/, '').toLowerCase(), to])
);

module.exports = (req, res, next) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') return next();
  const key = req.path.replace(/\/+$/, '').toLowerCase();
  const to = table.get(key);
  if (!to) return next();
  // Conserva los parámetros (UTM, gclid) para no perder atribución de campañas viejas.
  const qs = req.originalUrl.includes('?') ? req.originalUrl.slice(req.originalUrl.indexOf('?')) : '';
  const [pathPart, hash] = to.split('#');
  res.redirect(301, `${pathPart}${qs}${hash ? `#${hash}` : ''}`);
};
