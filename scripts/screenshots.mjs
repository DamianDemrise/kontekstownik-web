// Zrzuty ekranu w zadanych rozdzielczościach + kontrole DOM (poziomy scroll, błędy konsoli, linki).
// Użycie: node scripts/screenshots.mjs [url] [katalog]   (domyślnie podgląd builda na :4188)
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const URL_ = process.argv[2] || 'http://localhost:4188/';
const OUT = process.argv[3] || 'docs/screenshots';
const CHROME = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const SIZES = [
  [390, 844, 'en-mobile-390x844', true, 'en/'], [1366, 768, 'en-laptop-1366x768', false, 'en/'],
  [320, 568, 'mobile-320x568', true], [375, 812, 'mobile-375x812', true], [390, 844, 'mobile-390x844', true],
  [430, 932, 'mobile-430x932', true], [844, 390, 'mobile-landscape-844x390', true], [768, 1024, 'tablet-768x1024', true],
  [1024, 768, 'tablet-landscape-1024x768', false], [1366, 768, 'laptop-1366x768', false], [1920, 1080, 'desktop-1920x1080', false],
  [2560, 1440, 'desktop-2560x1440', false], [1440, 600, 'desktop-low-1440x600', false],
];

mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ executablePath: CHROME, args: process.env.CHROME_ARGS ? [process.env.CHROME_ARGS] : [] });
let failed = 0;
for (const [w, h, name, mobile, path = ''] of SIZES) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: w > 1920 ? 1 : 2, isMobile: mobile, hasTouch: mobile });
  // Zrzuty kompozycji bez banera zgody (baner ma osobne zrzuty w test-functional.mjs)
  await ctx.addInitScript(`localStorage.setItem('kontekstownik-consent', JSON.stringify({ v: 1, analytics: false }))`);
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('requestfailed', (r) => errors.push(`request failed: ${r.url()}`));
  await page.goto(new URL(path, URL_).href, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1800);
  const r = await page.evaluate(() => {
    const rect = (s) => document.querySelector(s).getBoundingClientRect();
    const tiles = document.querySelector('.brand-tiles'), logo = rect('.brand__svg'),
      yt = rect(tiles ? '.brand-tile--main a[data-platform="youtube"]' : '.cta--yt'), tt = rect(tiles ? '.brand-tile--main a[data-platform="tiktok"]' : '.cta--tt');
    return {
      hScroll: document.documentElement.scrollWidth > window.innerWidth,
      vScroll: document.documentElement.scrollHeight > window.innerHeight,
      logoClipped: logo.left < 0 || logo.right > window.innerWidth,
      ctaH: Math.round(Math.min(yt.height, tt.height)),
      ctaW: [Math.round(yt.width), Math.round(tt.width)],
      overlap: !(yt.right <= tt.left || tt.bottom <= yt.top || yt.bottom <= tt.top || tt.right <= yt.left),
    };
  });
  const bad = r.hScroll || r.logoClipped || r.overlap || r.ctaH < 44 || errors.length;
  if (bad) failed++;
  console.log(`${bad ? 'FAIL' : 'ok  '} ${name}: hScroll=${r.hScroll} vScroll=${r.vScroll} logoClipped=${r.logoClipped} cta=${r.ctaW.join('/')}x${r.ctaH} overlap=${r.overlap}${errors.length ? ' errors=' + errors.join(' | ') : ''}`);
  // Obrazy są lazy: przewijamy całą stronę, żeby zrzut pełnej strony nie miał pustych okładek.
  await page.evaluate(async () => { for (let y = 0; y < document.documentElement.scrollHeight; y += innerHeight / 2) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 120)); } scrollTo(0, 0); });
  await page.waitForTimeout(600);
  const broken = await page.$$eval('img', (is) => is.filter((i) => i.getBoundingClientRect().width > 0 && (!i.complete || i.naturalWidth === 0)).map((i) => i.getAttribute('src')));
  if (broken.length) { failed++; console.log(`FAIL ${name}: niezaładowane obrazy ${broken.join(', ')}`); }
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: true });
  await ctx.close();
}
await browser.close();
process.exit(failed ? 1 : 0);
