// Generuje favicon PNG, apple-touch-icon, ikony manifestu (z public/favicon.svg)
// oraz og-image.jpg 1200×630 (zrzut zbudowanej strony). Wymaga działającego `npm run preview`.
import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';

const CHROME = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PREVIEW = process.argv[2] || 'http://localhost:4188/';
const svg = readFileSync(new URL('../public/favicon.svg', import.meta.url), 'utf8');
const browser = await chromium.launch({ executablePath: CHROME });

const icons = [['public/favicon-32.png', 32, true], ['public/apple-touch-icon.png', 180, false],
  ['public/icons/icon-192.png', 192, false], ['public/icons/icon-512.png', 512, false]];
for (const [out, size, rounded] of icons) {
  const page = await browser.newPage({ viewport: { width: size, height: size } });
  // apple-touch i manifest: pełny kwadrat (system sam zaokrągla), favicon: z zaokrągleniem z SVG
  const body = rounded ? svg : svg.replace('rx="14"', 'rx="0"');
  await page.setContent(`<style>html,body{margin:0;background:transparent}svg{width:${size}px;height:${size}px;display:block}</style>${body}`);
  await page.screenshot({ path: out, omitBackground: rounded });
  await page.close();
}

const og = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
await og.emulateMedia({ reducedMotion: 'reduce' });
await og.goto(PREVIEW, { waitUntil: 'networkidle' });
await og.waitForTimeout(800);
await og.screenshot({ path: 'public/og-image.jpg', type: 'jpeg', quality: 86 });
await browser.close();
console.log('ikony i og-image gotowe');
