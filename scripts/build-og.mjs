// Grafika do udostępniania (Open Graph, 1200×630): zrzut zbudowanej strony w układzie „plakatowym”.
// Większe logo, bez drobnych kategorii i stopki, żeby czytało się w dymku iMessage/WhatsApp/Messengera.
// Użycie (przy działającym `npm run preview`): node scripts/build-og.mjs [url] [plik]
import { chromium } from 'playwright';

const URL_ = process.argv[2] || 'http://localhost:4188/';
const OUT = process.argv[3] || 'public/og-image-v3.jpg';
const CHROME = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

const browser = await chromium.launch({ executablePath: CHROME });
const ctx = await browser.newContext({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1, reducedMotion: 'reduce' });
await ctx.addInitScript(`localStorage.setItem('kontekstownik-consent', JSON.stringify({ v: 1, analytics: false }))`);
const page = await ctx.newPage();
await page.goto(URL_, { waitUntil: 'networkidle' });
await page.addStyleTag({ content: `
  :root { --u: 13px; }
  .topics, .legal, .consent, .watch__title { display: none !important; }
  .hero { gap: 44px; padding: 0 16px 40px; }
  .brand__logo { font-size: 84px; }
  .brand__tagline { font-size: 21px; margin-top: 26px; }
  .brand__rule { margin-top: 26px; }
  .cta { width: 300px; height: 84px; min-height: 0; font-size: 32px; border-radius: 22px; }
  .watch__buttons { gap: 28px; }
  .globe { right: -330px !important; }
  .panels { transform: translateX(-80px); }
  .hero { padding-top: 24px; }
` });
await page.waitForTimeout(600);
await page.screenshot({ path: OUT, type: 'jpeg', quality: 88 });
await browser.close();
console.log(OUT);
