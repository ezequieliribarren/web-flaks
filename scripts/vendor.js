// Copia GSAP y Lenis desde node_modules a public/vendor (sin bundler, sin CDN).
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const out = path.join(root, 'public', 'vendor');
const files = [
  ['gsap/dist/gsap.min.js', 'gsap.min.js'],
  ['gsap/dist/ScrollTrigger.min.js', 'ScrollTrigger.min.js'],
  ['lenis/dist/lenis.min.js', 'lenis.min.js'],
];

fs.mkdirSync(out, { recursive: true });
for (const [from, to] of files) {
  const src = path.join(root, 'node_modules', from);
  if (!fs.existsSync(src)) {
    console.warn(`[vendor] no encontrado: ${from}`);
    continue;
  }
  fs.copyFileSync(src, path.join(out, to));
}
console.log('[vendor] GSAP y Lenis copiados a public/vendor');
