// Generuje favicon PNG, apple-touch-icon, ikony manifestu (z public/favicon.svg)
// Wymaga działającego `npm run preview`. Grafika do udostępniania: scripts/build-og.mjs.
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

await browser.close();
console.log('ikony gotowe');
