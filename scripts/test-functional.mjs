// Testy funkcjonalne na zbudowanej stronie: linki, klawiatura, focus, hover, reduced motion, brak JS.
import { chromium } from 'playwright';

const URL_ = process.argv[2] || 'http://localhost:4188/';
const CHROME = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const browser = await chromium.launch({ executablePath: CHROME, args: process.env.CHROME_ARGS ? [process.env.CHROME_ARGS] : [] });
const results = [];
const check = (name, ok, info = '') => results.push(`${ok ? 'ok  ' : 'FAIL'} ${name}${info ? ' – ' + info : ''}`);

const REJECTED = `localStorage.setItem('kontekstownik-consent', JSON.stringify({ v: 1, analytics: false }))`;
{
  const ctx0 = await browser.newContext({ viewport: { width: 1366, height: 768 } });
  await ctx0.addInitScript(REJECTED);
  const page = await ctx0.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await page.goto(URL_, { waitUntil: 'networkidle' });
  const links = await page.$$eval('a.cta', (as) => as.map((a) => ({ href: a.href, target: a.target, rel: a.rel, name: a.getAttribute('aria-label') })));
  check('link YouTube', links[0]?.href === 'https://www.youtube.com/@kontekstowniktv' && links[0].target === '_blank' && links[0].rel === 'noopener noreferrer', links[0]?.href);
  check('link TikTok', links[1]?.href === 'https://www.tiktok.com/@kontekstownik' && links[1].target === '_blank' && links[1].rel === 'noopener noreferrer', links[1]?.href);
  check('nazwy dostępne', links.every((l) => l.name && l.name.length > 10));
  check('dokładnie 2 przyciski platform', (await page.$$('a.cta')).length === 2);

  await page.keyboard.press('Tab');
  const f1 = await page.evaluate(() => [document.activeElement.dataset.platform, getComputedStyle(document.activeElement).outlineStyle]);
  await page.keyboard.press('Tab');
  const f2 = await page.evaluate(() => document.activeElement.dataset.platform);
  check('Tab: YouTube → TikTok z widocznym focusem', f1[0] === 'youtube' && f1[1] === 'solid' && f2 === 'tiktok', `${f1.join('/')} → ${f2}`);
  await page.screenshot({ path: 'docs/screenshots/focus-keyboard-1366.png' });

  const before = await page.$eval('.cta--yt', (e) => getComputedStyle(e).boxShadow);
  await page.hover('.cta--yt');
  await page.waitForTimeout(500);
  const after = await page.$eval('.cta--yt', (e) => getComputedStyle(e).boxShadow);
  check('hover YouTube zmienia poświatę', before !== after);
  await page.screenshot({ path: 'docs/screenshots/hover-youtube-1366.png' });

  const globeDrawn = await page.$eval('.globe__dots', (c) => c.width > 100);
  check('globus narysowany (canvas)', globeDrawn);
  const missingImgs = await page.$$eval('img', (is) => is.filter((i) => !i.complete || i.naturalWidth === 0).length);
  check('brak brakujących grafik', missingImgs === 0);
  check('brak błędów JS/konsoli', errors.length === 0, errors.join(' | '));
  await ctx0.close();
}
{
  const ctx = await browser.newContext({ viewport: { width: 1366, height: 768 }, reducedMotion: 'reduce' });
  await ctx.addInitScript(REJECTED);
  const page = await ctx.newPage();
  await page.goto(URL_, { waitUntil: 'networkidle' });
  const anim = await page.evaluate(() => [getComputedStyle(document.querySelector('.panel')).animationName, getComputedStyle(document.querySelector('.globe__orbit')).animationName]);
  const a = await page.$eval('.globe__dots', (c) => c.toDataURL().length);
  await page.waitForTimeout(1200);
  const b = await page.$eval('.globe__dots', (c) => c.toDataURL().length);
  check('reduced motion: brak ruchu paneli/orbity', anim.every((n) => n === 'none'), anim.join(','));
  check('reduced motion: globus statyczny', a === b);
  await ctx.close();
}
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, javaScriptEnabled: false });
  const page = await ctx.newPage();
  await page.goto(URL_);
  const vis = await page.$eval('.cta--yt', (e) => e.getBoundingClientRect().height > 40);
  check('bez JavaScriptu przyciski działają', vis);
  await ctx.close();
}
// --- Zgoda i analityka. Nic nie trafia do GA: żądania /g/collect są blokowane, a sendBeacon podmieniony na zapis lokalny.
async function consentContext(viewport = { width: 1366, height: 768 }) {
  const ctx = await browser.newContext({ viewport });
  const log = { gtag: 0, hits: [] };
  await ctx.addInitScript(() => { navigator.sendBeacon = (url, data) => { (window.__beacons ||= []).push(url + '&' + (data || '')); return true; }; });
  await ctx.route(/\/g\/collect/, (r) => r.abort());
  ctx.on('request', (r) => { if (/\/g\/collect/.test(r.url())) log.hits.push(r.url() + '&' + (r.postData() || '')); });
  await ctx.route(/youtube\.com|tiktok\.com/, (r) => r.abort());
  ctx.on('request', (r) => { if (r.url().includes('googletagmanager.com/gtag/js')) log.gtag++; });
  return { ctx, log };
}
{
  const { ctx, log } = await consentContext();
  const page = await ctx.newPage();
  await page.goto(URL_, { waitUntil: 'networkidle' });
  check('baner zgody widoczny przy pierwszej wizycie', await page.isVisible('#consent'));
  check('przed zgodą brak gtag.js i cookies', log.gtag === 0 && (await ctx.cookies()).length === 0);
  await page.screenshot({ path: 'docs/screenshots/consent-banner-1366.png' });
  await page.click('[data-consent="reject"]');
  await page.waitForTimeout(800);
  check('Odrzucam: baner znika, nic się nie ładuje', !(await page.isVisible('#consent')) && log.gtag === 0);
  await page.reload({ waitUntil: 'networkidle' });
  check('Odrzucam: wybór zapamiętany po przeładowaniu', !(await page.isVisible('#consent')) && log.gtag === 0 && (await ctx.cookies()).length === 0);
  await ctx.close();
}
{
  const { ctx, log } = await consentContext();
  const page = await ctx.newPage();
  await page.goto(URL_, { waitUntil: 'networkidle' });
  await page.click('[data-consent="accept"]');
  await page.waitForTimeout(2500);
  const ga = (await ctx.cookies()).filter((c) => c.name.startsWith('_ga'));
  check('Akceptuję: gtag.js ładuje się, cookies _ga zapisane', log.gtag === 1 && ga.length >= 1, ga.map((c) => c.name).join(','));
  check('Akceptuję: page_view wysłany', log.hits.some((h) => /[?&]en=page_view/.test(h)));
  ctx.on('page', (p) => p.close().catch(() => {}));
  // GA4 łączy zdarzenia w paczki wysyłane z kilkusekundowym opóźnieniem
  await page.click('.cta--yt');
  await page.waitForTimeout(7000);
  await page.click('.cta--tt');
  await page.waitForTimeout(7000);
  const beacons = await page.evaluate(() => window.__beacons || []);
  const pc = [...log.hits, ...beacons].filter((h) => /en=platform_click/.test(h));
  check('klik YouTube -> platform_click platform=youtube', pc.some((h) => /ep\.platform=youtube/.test(h)));
  check('klik TikTok -> platform_click platform=tiktok', pc.some((h) => /ep\.platform=tiktok/.test(h)));
  await page.reload({ waitUntil: 'networkidle' });
  check('Akceptuję: po przeładowaniu bez banera, analityka działa', !(await page.isVisible('#consent')) && log.gtag === 2);
  await page.click('[data-consent-open]');
  check('Ustawienia cookies otwierają baner', await page.isVisible('#consent'));
  await Promise.all([page.waitForNavigation(), page.click('[data-consent="reject"]')]);
  await page.waitForLoadState('networkidle');
  const left = (await ctx.cookies()).filter((c) => c.name.startsWith('_ga'));
  check('wycofanie zgody usuwa cookies _ga i wyłącza GA', left.length === 0 && log.gtag === 2, left.map((c) => c.name).join(','));
  await ctx.close();
}
{
  const { ctx } = await consentContext({ width: 390, height: 844 });
  const page = await ctx.newPage();
  await page.goto(URL_, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1200);
  const r = await page.evaluate(() => [...document.querySelectorAll('.consent__btn')].map((b) => b.getBoundingClientRect().height));
  check('baner na telefonie: przyciski ≥ 44 px', r.every((h) => h >= 44), r.join('/'));
  await page.screenshot({ path: 'docs/screenshots/consent-banner-390.png' });
  await page.goto(URL_ + 'polityka-prywatnosci/', { waitUntil: 'networkidle' });
  check('polityka prywatności: 200 i nagłówek', (await page.textContent('h1')).includes('Polityka prywatności'));
  await page.screenshot({ path: 'docs/screenshots/polityka-390.png', fullPage: true });
  await ctx.close();
}
// --- Sekcja materiałów (tylko gdy build ma opublikowane materiały, np. `npm run build:przyklad`)
{
  const { ctx, log } = await consentContext({ width: 1366, height: 768 });
  const page = await ctx.newPage();
  await page.goto(URL_, { waitUntil: 'networkidle' });
  const n = await page.$$eval('.materials .card', (c) => c.length);
  if (!n) {
    check('materiały: brak opublikowanych -> brak sekcji i strzałki', !(await page.$('#materialy')) && !(await page.$('.scroll-hint')));
  } else {
    const info = await page.evaluate(() => ({
      embeds: document.querySelectorAll('iframe, video, embed, object').length,
      bad: [...document.querySelectorAll('.materials a[href]')].filter((a) => a.target !== '_blank' || a.rel !== 'noopener noreferrer' || !/^https:\/\/(www\.youtube\.com|youtu\.be|youtube\.com|www\.tiktok\.com)\//.test(a.href)).length,
      imgs: [...document.querySelectorAll('.card__cover img')].map((i) => [i.getAttribute('width'), i.getAttribute('loading'), i.srcset.split(',').length]),
      names: [...document.querySelectorAll('.materials a')].map((a) => a.textContent.replace(/\s+/g, ' ').trim()),
    }));
    check(`materiały: ${n} kart, zero odtwarzaczy na stronie`, info.embeds === 0);
    check('materiały: wszystkie linki do konkretnych platform, nowa karta, noopener', info.bad === 0);
    check('materiały: okładki lazy, wymiary, srcset 3 szer.', info.imgs.every(([w, l, s]) => w === '1920' && l === 'lazy' && s === 3));
    check('materiały: linki mają nazwę z tytułem lub platformą', info.names.every((t) => t.length > 12));
    await page.click('.scroll-hint');
    await page.waitForTimeout(800);
    check('strzałka „Najnowsze materiały” przewija do sekcji', await page.evaluate(() => Math.abs(document.getElementById('materialy').getBoundingClientRect().top) < 40));
    const broken = await page.$$eval('.card__cover img', (is) => is.filter((i) => !i.complete || !i.naturalWidth).length);
    check('materiały: okładki się wczytują', broken === 0);
    await page.click('[data-consent="accept"]');
    await page.waitForTimeout(2500);
    ctx.on('page', (p) => p.close().catch(() => {}));
    const first = await page.$eval('.card .watch-link--tt', (a) => a.dataset.material);
    await page.click('.card .watch-link--tt');
    await page.waitForTimeout(7000);
    const beacons = await page.evaluate(() => window.__beacons || []);
    const hit = [...log.hits, ...beacons].find((h) => /en=platform_click/.test(h) && h.includes('placement=material'));
    check('klik w karcie -> platform_click z material_id i kategorią', !!hit && hit.includes(`ep.material_id=${first}`) && /ep\.category=/.test(hit));
  }
  await ctx.close();
}
await browser.close();
console.log(results.join('\n'));
process.exit(results.some((r) => r.startsWith('FAIL')) ? 1 : 0);
