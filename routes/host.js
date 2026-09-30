// Redirección 301 entre www y dominio sin www según CANONICAL_HOST ("apex" | "www" | vacío).
module.exports = (mode) => (req, res, next) => {
  const host = (req.headers.host || '').toLowerCase();
  if (!mode || host.startsWith('localhost') || /^\d+\.\d+\.\d+\.\d+/.test(host)) return next();
  const isWww = host.startsWith('www.');
  if (mode === 'apex' && isWww) return res.redirect(301, `https://${host.slice(4)}${req.originalUrl}`);
  if (mode === 'www' && !isWww) return res.redirect(301, `https://www.${host}${req.originalUrl}`);
  next();
};
