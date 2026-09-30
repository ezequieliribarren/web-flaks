// Uso interno de QA: corta una captura larga en tramos reducidos para revisarla.
// node scripts/slice.mjs .shots/archivo.png [altoTramo=1800] [ancho=900]
import sharp from 'sharp';

const [file, sliceH = 1800, width = 900] = process.argv.slice(2);
const img = sharp(file);
const { width: w, height: h } = await img.metadata();
const n = Math.ceil(h / sliceH);
for (let i = 0; i < n; i++) {
  const top = i * sliceH;
  const height = Math.min(sliceH, h - top);
  const out = file.replace(/\.png$/, `_part${i + 1}.png`);
  await sharp(file).extract({ left: 0, top, width: w, height }).resize({ width: Math.min(Number(width), w) }).toFile(out);
  console.log(out);
}
console.log(`total ${w}x${h}`);
