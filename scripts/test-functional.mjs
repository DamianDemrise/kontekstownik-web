// Testy funkcjonalne na zbudowanej stronie: linki, klawiatura, focus, hover, reduced motion, brak JS.
import { chromium } from 'playwright';

const URL_ = process.argv[2] || 'http://localhost:4188/';
const CHROME = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const browser = await chromium.launch({ executablePath: CHROME });
const results = [];
const check = (name, ok, info = '') => results.push(`${ok ? 'ok  ' : 'FAIL'} ${name}${info ? ' – ' + info : ''}`);

{
  const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await page.goto(URL_, { waitUntil: 'networkidle' });
  const links = await page.$$eval('a.cta', (as) => as.map((a) => ({ href: a.href, target: a.target, rel: a.rel, name: a.getAttribute('aria-label') })));
  check('link YouTube', links[0]?.href === 'https://www.youtube.com/@kontekstowniktv' && links[0].target === '_blank' && links[0].rel === 'noopener noreferrer', links[0]?.href);
  check('link TikTok', links[1]?.href === 'https://www.tiktok.com/@kontekstownik' && links[1].target === '_blank' && links[1].rel === 'noopener noreferrer', links[1]?.href);
  check('nazwy dostępne', links.every((l) => l.name && l.name.length > 10));
  check('dokładnie 2 linki na stronie', (await page.$$('a')).length === 2);

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
  await page.close();
}
{
  const ctx = await browser.newContext({ viewport: { width: 1366, height: 768 }, reducedMotion: 'reduce' });
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
await browser.close();
console.log(results.join('\n'));
process.exit(results.some((r) => r.startsWith('FAIL')) ? 1 : 0);
