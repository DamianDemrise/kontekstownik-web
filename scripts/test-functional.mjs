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
// --- Kanały dodatkowe: Facebook, Instagram, e-mail
{
  const { ctx, log } = await consentContext({ width: 1366, height: 768 });
  const page = await ctx.newPage();
  await page.goto(URL_, { waitUntil: 'networkidle' });
  const soc = await page.$$eval('a[data-social]', (as) => as.map((a) => ({ n: a.dataset.social, href: a.href, t: a.target, rel: a.rel, name: a.getAttribute('aria-label'), h: a.getBoundingClientRect().height })));
  check('kanały: Facebook, Instagram, e-mail', soc.map((x) => x.n).join() === 'facebook,instagram,email', soc.map((x) => x.href).join(' '));
  check('kanały: FB/IG w nowej karcie z noopener, mailto do kontekstownik@gmail.com',
    soc.filter((x) => x.n !== 'email').every((x) => x.t === '_blank' && x.rel === 'noopener noreferrer') && soc.find((x) => x.n === 'email').href === 'mailto:kontekstownik@gmail.com');
  check('kanały: nazwy dostępne i cel dotykowy ≥ 44 px', soc.every((x) => x.name && x.h >= 44));
  await page.click('[data-consent="accept"]');
  await page.waitForTimeout(2500);
  ctx.on('page', (p) => p.close().catch(() => {}));
  await page.click('a[data-social="instagram"]');
  await page.waitForTimeout(7000);
  const beacons = await page.evaluate(() => window.__beacons || []);
  const all = [...log.hits, ...beacons];
  check('klik Instagram -> social_click (nie platform_click)', all.some((h) => /en=social_click/.test(h) && /ep\.network=instagram/.test(h)) && !all.some((h) => /en=platform_click/.test(h)));
  await ctx.close();
}
// --- Sekcja materiałów (tylko gdy build ma opublikowane materiały, np. `npm run build:przyklad`)
{
  const { ctx, log } = await consentContext({ width: 1366, height: 768 });
  const page = await ctx.newPage();
  await page.goto(URL_, { waitUntil: 'networkidle' });
  const n = await page.$$eval('.materials .card', (c) => c.length);
  if (!n) {
    check('materiały: brak opublikowanych -> brak sekcji i paska', !(await page.$('#materialy')) && !(await page.$('[data-new-pill]')));
  } else {
    const info = await page.evaluate(() => ({
      embeds: document.querySelectorAll('iframe, video, embed, object').length,
      bad: [...document.querySelectorAll('.materials a[data-platform]')].filter((a) => a.target !== '_blank' || a.rel !== 'noopener noreferrer' || !/^https:\/\/(www\.youtube\.com|youtu\.be|youtube\.com|www\.tiktok\.com)\//.test(a.href)).length,
      pages: [...document.querySelectorAll('.card__main')].map((a) => new URL(a.href).pathname),
      imgs: [...document.querySelectorAll('.card__cover img')].map((i) => [i.getAttribute('width'), i.getAttribute('loading'), i.srcset.split(',').length]),
      names: [...document.querySelectorAll('.materials a')].map((a) => a.textContent.replace(/\s+/g, ' ').trim()),
    }));
    check(`materiały: ${n} kart, zero odtwarzaczy na stronie`, info.embeds === 0);
    check('materiały: przyciski prowadzą do konkretnych filmów, nowa karta, noopener', info.bad === 0);
    check('materiały: okładka i tytuł karty prowadzą do podstrony', info.pages.every((x) => /^\/materialy\/[a-z0-9-]+\/$/.test(x)));
    check('materiały: okładki lazy, wymiary, srcset 3 szer.', info.imgs.every(([w, l, s]) => w === '1920' && l === 'lazy' && s === 3));
    check('materiały: linki mają nazwę z tytułem lub platformą', info.names.every((t) => t.length > 12));
    // Pasek „Nowy materiał”: czeka na decyzję o cookies, potem pojawia się; klik przewija do sekcji i znika
    await page.waitForTimeout(1800);
    check('pasek ukryty, dopóki widać baner zgody', await page.$eval('[data-new-pill]', (p) => p.hidden));
    await page.click('[data-consent="reject"]');
    await page.waitForTimeout(800);
    check('pasek „Nowy materiał” pojawia się po decyzji o cookies', await page.isVisible('[data-new-pill]'));
    await page.screenshot({ path: 'docs/screenshots/nowy-material-pasek-1366.png' });
    await page.click('[data-new-pill-link]');
    await page.waitForTimeout(1200);
    const after = await page.evaluate(() => ({ top: document.getElementById('materialy').getBoundingClientRect().top, hidden: document.querySelector('[data-new-pill]').hidden }));
    check('klik paska przewija do materiałów i chowa pasek', Math.abs(after.top) < 40 && after.hidden);
    const broken = await page.$$eval('.card__cover img', (is) => is.filter((i) => !i.complete || !i.naturalWidth).length);
    check('materiały: okładki się wczytują', broken === 0);
    await page.click('[data-consent-open]');
    await page.click('[data-consent="accept"]');
    await page.waitForTimeout(2500);
    ctx.on('page', (p) => p.close().catch(() => {}));
    // Podstrona materiału
    {
      const sub = new URL(info.pages[0], URL_).href;
      const spCtx = await browser.newContext({ viewport: { width: 1366, height: 768 } });
      await spCtx.addInitScript(REJECTED);
      const sp = await spCtx.newPage();
      const errs = [];
      sp.on('pageerror', (e) => errs.push(e.message));
      sp.on('console', (m) => m.type() === 'error' && errs.push(m.text()));
      const resp = await sp.goto(sub, { waitUntil: 'networkidle' });
      const d = await sp.evaluate(() => {
        const meta = (n) => document.querySelector(`meta[property="${n}"], meta[name="${n}"]`)?.content;
        let ld = null;
        try { ld = JSON.parse(document.querySelector('script[type="application/ld+json"]').textContent); } catch { /* błąd = test nie przejdzie */ }
        return {
          canonical: document.querySelector('link[rel=canonical]')?.href, title: document.title, h1: document.querySelectorAll('h1').length,
          og: meta('og:image'), ogType: meta('og:type'), desc: meta('description'),
          ld: ld?.['@graph']?.map((x) => x['@type']).join(','),
          embeds: document.querySelectorAll('iframe, video, embed, object').length,
          ctas: [...document.querySelectorAll('.mp-watch a[data-platform]')].map((a) => [a.dataset.platform, a.target, a.rel, a.dataset.placement]),
          sources: [...document.querySelectorAll('.mp-sources a')].every((a) => a.target === '_blank' && a.rel === 'noopener noreferrer' && a.href.startsWith('https://')),
          hscroll: document.documentElement.scrollWidth > innerWidth,
          coverEager: document.querySelector('.mp-cover img')?.getAttribute('fetchpriority') === 'high',
        };
      });
      check('podstrona: 200, jeden h1, opis, brak błędów JS', resp.status() === 200 && d.h1 === 1 && !!d.desc && errs.length === 0, errs.join('|'));
      check('podstrona: canonical na adres podstrony', d.canonical === `https://www.kontekstownik.pl${new URL(sub).pathname}`, d.canonical);
      check('podstrona: Open Graph article z własną grafiką', d.ogType === 'article' && /\/okladki\/.+-og\.jpg$/.test(d.og || ''), d.og);
      check('podstrona: dane strukturalne Article + BreadcrumbList', d.ld === 'Article,BreadcrumbList', d.ld);
      check('podstrona: zero odtwarzaczy, przyciski platform w nowej karcie', d.embeds === 0 && d.ctas.length >= 1 && d.ctas.every(([, t, r, pl]) => t === '_blank' && r === 'noopener noreferrer' && pl === 'podstrona'));
      check('podstrona: źródła jako bezpieczne linki https', d.sources);
      check('podstrona: okładka ładowana priorytetowo, bez poziomego przewijania', d.coverEager && !d.hscroll);
      const og = await sp.request.get(new URL(new URL(d.og).pathname, URL_).href);
      const ogBuf = await og.body();
      check('podstrona: grafika OG istnieje (JPEG)', og.status() === 200 && ogBuf[0] === 0xff && ogBuf[1] === 0xd8);
      await spCtx.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: new URL(URL_).origin });
      await sp.evaluate(() => { delete Navigator.prototype.share; });
      await sp.click('[data-share]');
      await sp.waitForTimeout(400);
      check('podstrona: Udostępnij kopiuje link', (await sp.textContent('.mp-share__status')).includes('skopiowany'));
      await spCtx.close();
    }
    const first = await page.$eval('.card .watch-link--tt', (a) => a.dataset.material);
    await page.click('.card .watch-link--tt');
    await page.waitForTimeout(7000);
    const beacons = await page.evaluate(() => window.__beacons || []);
    const hit = [...log.hits, ...beacons].find((h) => /en=platform_click/.test(h) && h.includes('placement=material'));
    check('klik w karcie -> platform_click z material_id i kategorią', !!hit && hit.includes(`ep.material_id=${first}`) && /ep\.category=/.test(hit));
    // Zamknięcie paska krzyżykiem pamiętane do końca wizyty (osobny kontekst ze zgodą zapisaną, baner nie blokuje)
    const ctx2 = await browser.newContext({ viewport: { width: 390, height: 844 } });
    await ctx2.addInitScript(REJECTED);
    const p2 = await ctx2.newPage();
    await p2.goto(URL_, { waitUntil: 'networkidle' });
    await p2.waitForTimeout(1800);
    await p2.click('[data-new-pill-close]');
    await p2.waitForTimeout(600);
    await p2.reload({ waitUntil: 'networkidle' });
    await p2.waitForTimeout(1800);
    check('zamknięty pasek nie wraca w tej samej wizycie', !(await p2.isVisible('[data-new-pill]')));
    await ctx2.close();
  }
  await ctx.close();
}
await browser.close();
console.log(results.join('\n'));
process.exit(results.some((r) => r.startsWith('FAIL')) ? 1 : 0);
