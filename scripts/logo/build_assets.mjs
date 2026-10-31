// Zestaw plików logo z wzorców brand/svg/*.svg (generuje scripts/logo/build_logo.py):
//  brand/png/*  – do social mediów, filmów i materiałów (przezroczyste tło, chyba że nazwa mówi inaczej)
//  public/*     – favicony i ikony strony
// Uruchomienie: node scripts/logo/build_assets.mjs
import sharp from 'sharp';
import { mkdirSync, copyFileSync } from 'node:fs';

const SVG = 'brand/svg/';
const PNG = 'brand/png/';
mkdirSync(PNG, { recursive: true });
mkdirSync('public/icons', { recursive: true });

// SVG ma wymiary w jednostkach fontu (~10 000 px szerokości), więc gęstość dobieramy do docelowej szerokości.
async function render(src, out, width, { height, background, pad = 0 } = {}) {
  const meta = await sharp(SVG + src, { density: 72 }).metadata();
  const inner = Math.round(width * (1 - pad * 2));
  const density = Math.max(1, Math.round((72 * inner) / meta.width));
  let img = sharp(SVG + src, { density }).resize({ width: inner, height: height ? Math.round(height * (1 - pad * 2)) : undefined, fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } });
  let buf = await img.png().toBuffer();
  if (pad || background || height) {
    const h = height || (await sharp(buf).metadata()).height + Math.round(width * pad * 2);
    buf = await sharp({ create: { width, height: h, channels: 4, background: background || { r: 0, g: 0, b: 0, alpha: 0 } } })
      .composite([{ input: buf, gravity: 'center' }]).png().toBuffer();
  }
  await sharp(buf).png({ compressionLevel: 9 }).toFile(out);
}

const jobs = [
  // Logotyp poziomy
  ['logo-kolor.svg', `${PNG}logo-na-ciemnym-2400.png`, 2400],
  ['logo-na-jasnym.svg', `${PNG}logo-na-jasnym-2400.png`, 2400],
  ['logo-bialy.svg', `${PNG}logo-bialy-2400.png`, 2400],
  ['logo-czarny.svg', `${PNG}logo-czarny-2400.png`, 2400],
  ['logo-kolor.svg', `${PNG}logo-na-ciemnym-tlo-2400x800.png`, 2400, { height: 800, background: '#080D12', pad: 0.1 }],
  // Logo pionowe
  ['logo-pionowe-kolor.svg', `${PNG}logo-pionowe-na-ciemnym-1600.png`, 1600],
  ['logo-pionowe-na-jasnym.svg', `${PNG}logo-pionowe-na-jasnym-1600.png`, 1600],
  // Sygnet
  ['sygnet-kolor.svg', `${PNG}sygnet-na-ciemnym-1024.png`, 1024],
  ['sygnet-na-jasnym.svg', `${PNG}sygnet-na-jasnym-1024.png`, 1024],
  // Awatar do YouTube / TikTok / Instagram / Facebook (kwadrat, platforma przycina do koła)
  ['awatar.svg', `${PNG}awatar-800.png`, 800],
  ['awatar.svg', `${PNG}awatar-2048.png`, 2048],
  // Znak wodny do filmów (biały; przezroczystość ustawia się w montażu, zalecane 60–80%)
  ['sygnet-bialy.svg', `${PNG}znak-wodny-sygnet-bialy-400.png`, 400],
  ['logo-bialy.svg', `${PNG}znak-wodny-logo-bialy-1200.png`, 1200],
  // Strona
  ['favicon.svg', 'public/favicon-32.png', 32],
  ['favicon.svg', 'public/favicon-16.png', 16],
  ['favicon-pelne-tlo.svg', 'public/apple-touch-icon.png', 180],
  ['awatar.svg', 'public/icons/icon-192.png', 192],
  ['awatar.svg', 'public/icons/icon-512.png', 512],
];
for (const [src, out, w, opts] of jobs) await render(src, out, w, opts);
copyFileSync(`${SVG}favicon.svg`, 'public/favicon.svg');
mkdirSync('public/brand', { recursive: true });
for (const n of ['logo-kolor.svg', 'logo-na-jasnym.svg', 'sygnet-kolor.svg']) copyFileSync(`${SVG}${n}`, `public/brand/${n}`);
console.log(`gotowe: ${jobs.length} plików PNG + public/favicon.svg`);
