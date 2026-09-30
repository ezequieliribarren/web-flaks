// Uso interno de QA: arma una hoja de contactos con varias capturas.
// node scripts/sheet.mjs salida.png cols ancho img1.png img2.png ...
import sharp from 'sharp';

const [out, colsArg, widthArg, ...files] = process.argv.slice(2);
const cols = Number(colsArg) || 3;
const w = Number(widthArg) || 480;
const metas = await Promise.all(files.map((f) => sharp(f).metadata()));
const h = Math.round((w * metas[0].height) / metas[0].width);
const gap = 8;
const rows = Math.ceil(files.length / cols);
const tiles = await Promise.all(files.map((f) => sharp(f).resize(w, h, { fit: 'cover', position: 'top' }).toBuffer()));
await sharp({ create: { width: cols * w + (cols + 1) * gap, height: rows * h + (rows + 1) * gap, channels: 3, background: '#ff00ff' } })
  .composite(tiles.map((input, i) => ({ input, left: gap + (i % cols) * (w + gap), top: gap + Math.floor(i / cols) * (h + gap) })))
  .png()
  .toFile(out);
console.log(out);
