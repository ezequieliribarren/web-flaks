// Genera versiones con fondo transparente de los logos oficiales (que vienen con fondo violeta).
// Uso: node scripts/brand.mjs
//   public/img/brand/LOGO.png        → logo-icon.png      (ícono "F", transparente, recortado)
//   public/img/brand/logo_flaks.png  → logo-wordmark.png  (wordmark "Flaks", transparente, recortado)
// El canal alfa se calcula por "verdosidad" de cada píxel, así se conserva el antialiasing.
import sharp from 'sharp';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'public', 'img', 'brand');
const GREEN = [0, 255, 127];

async function extract(src, out, height) {
  const { data, info } = await sharp(path.join(dir, src)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const px = Buffer.alloc(info.width * info.height * 4);
  for (let i = 0; i < info.width * info.height; i++) {
    const r = data[i * 4], g = data[i * 4 + 1], b = data[i * 4 + 2], a = data[i * 4 + 3];
    // Fondo: g ≈ 15-30. Verde de marca: g ≈ 255. Interpolamos entre ambos.
    const greenness = Math.max(0, g - Math.max(r, b * 0.6));
    const alpha = Math.max(0, Math.min(1, (greenness - 20) / 170)) * (a / 255);
    px.set([...GREEN, Math.round(alpha * 255)], i * 4);
  }
  await sharp(px, { raw: { width: info.width, height: info.height, channels: 4 } })
    .trim({ threshold: 1 })
    .resize({ height, withoutEnlargement: false })
    .png({ compressionLevel: 9 })
    .toFile(path.join(dir, out));
  console.log(out);
}

await extract('LOGO.png', 'logo-icon.png', 256);
await extract('logo_flaks.png', 'logo-wordmark.png', 120);
