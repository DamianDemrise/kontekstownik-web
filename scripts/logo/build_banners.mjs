// Banery kanałów z prawdziwej sceny strony (panele, globus, podłoga) + logo i hasło w polu bezpiecznym.
// Wymaga działającego `npm run preview` (http://localhost:4188). Wynik: brand/banery/*.png (+ podgląd pola bezpiecznego).
// Uruchomienie: node scripts/logo/build_banners.mjs
import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';

const URL_ = process.argv[2] || 'http://localhost:4188/';
const OUT = 'brand/banery/';
const logo = readFileSync('brand/svg/logo-kolor.svg', 'utf8');
const BANNERS = [
  // YouTube: 2560×1440, pole widoczne na każdym urządzeniu 1546×423 (środek)
  { name: 'youtube-baner-2560x1440', w: 2560, h: 1440, safe: [1546, 423], logoW: 1050, tag: 34, topics: 22, panelsX: -230 },
  // Facebook: okładka 1640×624; na telefonie widać środek ok. 1200×624, więc treść w 1100×420
  { name: 'facebook-okladka-1640x624', w: 1640, h: 624, safe: [1100, 420], logoW: 760, tag: 24, topics: 16, panelsX: 0 },
];

const browser = await chromium.launch({ executablePath: process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' });
for (const b of BANNERS) {
  const ctx = await browser.newContext({ viewport: { width: b.w, height: b.h }, deviceScaleFactor: 1, reducedMotion: 'reduce' });
  await ctx.addInitScript(`localStorage.setItem('kontekstownik-consent', JSON.stringify({ v: 1, analytics: false }))`);
  const page = await ctx.newPage();
  await page.goto(URL_, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  await page.evaluate(({ b, logo }) => {
    document.querySelectorAll('main, .legal, .lang, .consent, [data-new-pill]').forEach((e) => e.remove());
    const box = document.createElement('div');
    box.innerHTML = `<div class="bn">${logo}<p class="bn__tag">Wyjaśniamy, co naprawdę się dzieje</p><span class="bn__rule"></span>
      <p class="bn__topics">Polityka · Gospodarka · Społeczeństwo · Świat</p></div>`;
    document.body.appendChild(box.firstChild);
    const st = document.createElement('style');
    st.textContent = `.bn{position:fixed;inset:0;margin:auto;width:${b.safe[0]}px;height:${b.safe[1]}px;display:flex;flex-direction:column;align-items:center;justify-content:center;z-index:5;font-family:Montserrat,sans-serif;color:#F5F7FA;text-align:center}
      .bn svg{width:${b.logoW}px;height:auto;display:block}
      .bn__tag{margin:${b.tag * 0.9}px 0 0;font-size:${b.tag}px;font-weight:500;letter-spacing:.32em;text-transform:uppercase;padding-left:.32em}
      .bn__rule{display:block;width:${b.tag * 5}px;height:${Math.max(3, b.tag / 6)}px;background:#FF8A00;margin-top:${b.tag * 0.8}px;box-shadow:0 0 ${b.tag}px rgb(255 138 0 / .45)}
      .panels{transform:translateX(${b.panelsX}px)}
      .bn__topics{margin:${b.tag * 0.8}px 0 0;font-size:${b.topics}px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:#AEB9C4}`;
    document.head.appendChild(st);
  }, { b, logo });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${OUT}${b.name}.png` });
  // Podgląd z zaznaczonym polem bezpiecznym (tylko do kontroli, nie do wgrywania)
  await page.evaluate((b) => {
    const g = document.createElement('div');
    g.style.cssText = `position:fixed;inset:0;margin:auto;width:${b.safe[0]}px;height:${b.safe[1]}px;outline:4px dashed #22d3ee;z-index:9`;
    document.body.appendChild(g);
  }, b);
  await page.screenshot({ path: `${OUT}${b.name}-pole-bezpieczne.png` });
  await ctx.close();
}
await browser.close();
console.log('banery gotowe');
