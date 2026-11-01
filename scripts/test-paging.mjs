// Testy stronicowania materiałów: logika (9/10/18/19, filtr, zakres) i zachowanie w przeglądarce na wygenerowanym HTML.
// `node scripts/test-paging.mjs` – nie wymaga `npm run preview`.
import { mkdtempSync, mkdirSync, writeFileSync, copyFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { chromium } from 'playwright';
import { loadMaterials } from './materials.mjs';
import { renderSection } from './materials-render.mjs';
import { paginate, PAGE_SIZE } from '../src/scripts/materials-paging.js';

const results = [];
const check = (name, ok, info = '') => results.push(`${ok ? 'ok  ' : 'FAIL'} ${name}${info ? ' – ' + info : ''}`);

// --- logika
check('rozmiar strony = 9', PAGE_SIZE === 9);
for (const [total, pages, last] of [[0, 1, 0], [1, 1, 1], [9, 1, 9], [10, 2, 1], [18, 2, 9], [19, 3, 1]]) {
  const p = paginate(total, pages);
  check(`${total} materiałów -> ${pages} str., ostatnia ma ${last}`, p.pages === pages && p.to - p.from === last, `${p.from}-${p.to}`);
}
check('strona poza zakresem jest przycinana (brak pustej strony)', paginate(10, 5).page === 2 && paginate(10, 0).page === 1 && paginate(10, NaN).page === 1);
check('po filtrze (3 wyniki) strona 3 -> 1', paginate(3, 3).page === 1);

// --- przeglądarka (opcjonalnie; --logic-only nie uruchamia UI)
if (!process.argv.includes('--logic-only')) {
const CATS = ['polityka', 'gospodarka', 'swiat'];
async function sectionHtml(n) {
  const dir = mkdtempSync(join(tmpdir(), 'kx-pg-'));
  mkdirSync(join(dir, 'okladki'));
  copyFileSync('content/przyklad/okladki/2026-11-03-inflacja.jpg', join(dir, 'okladki', 'c.jpg'));
  const items = Array.from({ length: n }, (_, i) => ({
    id: `2026-10-${String(30 - (i % 28)).padStart(2, '0')}-t${i}`, status: 'published', title: `Materiał testowy numer ${i + 1}`, lead: 'Opis materiału.',
    category: CATS[i % 3], date: `2026-10-${String(30 - (i % 28)).padStart(2, '0')}`, cover: 'c.jpg',
    youtube: `https://www.youtube.com/watch?v=${String(i).padStart(11, 'A')}`, primary: 'youtube',
  }));
  writeFileSync(join(dir, 'materialy.json'), JSON.stringify(items));
  const loaded = await loadMaterials(dir);
  for (const m of loaded) m._cover = { 480: 'data:,', 960: 'data:,', 1440: 'data:,' }; // bez generowania WebP
  return renderSection(loaded, 'pl').section;
}
const js = { 'materials-tools.js': readFileSync('src/scripts/materials-tools.js', 'utf8'), 'materials-paging.js': readFileSync('src/scripts/materials-paging.js', 'utf8') };
const CHROME = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const browser = await chromium.launch({ executablePath: CHROME, args: process.env.CHROME_ARGS ? [process.env.CHROME_ARGS] : [] });
async function open(n, { noJs = false } = {}) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 800 }, javaScriptEnabled: !noJs });
  const page = await ctx.newPage();
  const html = `<!doctype html><html lang="pl"><body><main>${await sectionHtml(n)}</main><script type="module">import { initMaterialsTools } from '/materials-tools.js'; initMaterialsTools();</script></body></html>`;
  await page.route('https://t.test/**', (r) => {
    const f = r.request().url().split('/').pop();
    r.fulfill(js[f] ? { contentType: 'text/javascript', body: js[f] } : { contentType: 'text/html', body: html });
  });
  await page.goto('https://t.test/');
  await page.waitForTimeout(150);
  return { ctx, page };
}
const view = (page) => page.evaluate(() => ({
  shown: [...document.querySelectorAll('[data-mgrid] > li')].filter((li) => !li.hidden).length,
  total: document.querySelectorAll('[data-mgrid] > li').length,
  pager: !document.querySelector('[data-mpager]').hidden,
  state: document.querySelector('[data-page-state]').textContent,
  prev: document.querySelector('[data-page-prev]').disabled,
  next: document.querySelector('[data-page-next]').disabled,
}));

for (const [n, firstPage, pages] of [[9, 9, 1], [10, 9, 2], [18, 9, 2], [19, 9, 3]]) {
  const { ctx, page } = await open(n);
  let v = await view(page);
  check(`${n} mat.: strona 1 pokazuje ${firstPage} z ${n}, pasek ${pages > 1 ? 'widoczny' : 'ukryty'}`, v.shown === firstPage && v.total === n && v.pager === (pages > 1) && (pages === 1 || v.prev), JSON.stringify(v));
  if (pages > 1) {
    check(`${n} mat.: „Strona 1 z ${pages}”`, v.state === `Strona 1 z ${pages}`, v.state);
    for (let p = 2; p <= pages; p++) await page.click('[data-page-next]');
    v = await view(page);
    const lastCount = n - 9 * (pages - 1);
    check(`${n} mat.: ostatnia strona ma ${lastCount}, „Następna” zablokowana, fokus na numerze strony`, v.shown === lastCount && v.next && !v.prev && (await page.evaluate(() => document.activeElement.hasAttribute('data-page-state'))), JSON.stringify(v));
    await page.click('[data-page-prev]');
    v = await view(page);
    check(`${n} mat.: „Poprzednia” wraca o stronę`, v.state === `Strona ${pages - 1} z ${pages}`, v.state);
  }
  await ctx.close();
}
{ // filtr + sortowanie: powrót na stronę 1, brak pustej strony
  const { ctx, page } = await open(19);
  await page.click('[data-page-next]'); await page.click('[data-page-next]');
  check('19 mat.: strona 3 ma 1 kartę', (await view(page)).shown === 1);
  await page.click('[data-filter="polityka"]'); // 7 z 19 (i % 3 === 0)
  let v = await view(page);
  check('filtr wraca na stronę 1 i pokazuje 7 kart bez paska', v.shown === 7 && !v.pager && v.state === 'Strona 1 z 1', JSON.stringify(v));
  check('filtr: tylko wybrana kategoria', await page.evaluate(() => [...document.querySelectorAll('[data-mgrid] > li')].filter((li) => !li.hidden).every((li) => li.dataset.category === 'polityka')));
  await page.click('[data-filter="all"]'); await page.click('[data-page-next]');
  await page.click('[data-sort="oldest"]');
  v = await view(page);
  check('zmiana sortowania wraca na stronę 1', v.state === 'Strona 1 z 3' && v.shown === 9, JSON.stringify(v));
  const dates = await page.$$eval('[data-mgrid] > li:not([hidden])', (l) => l.map((x) => x.dataset.date));
  check('sortowanie „Najstarsze” działa na stronie 1', dates.join() === [...dates].sort().join());
  await ctx.close();
}
{ // bez JS: wszystkie karty i linki w HTML, pasek ukryty
  const { ctx, page } = await open(19, { noJs: true });
  const v = await page.evaluate(() => ({ visible: [...document.querySelectorAll('[data-mgrid] > li')].filter((li) => li.offsetParent).length, links: document.querySelectorAll('[data-mgrid] a.card__main').length, pager: !document.querySelector('[data-mpager]').hidden }));
  check('bez JS: 19 kart widocznych, 19 linków, brak paska', v.visible === 19 && v.links === 19 && !v.pager, JSON.stringify(v));
  await ctx.close();
}
await browser.close();
}

console.log(results.join('\n'));
const bad = results.filter((r) => r.startsWith('FAIL')).length;
console.log(`\n${results.length - bad}/${results.length} ok`);
process.exit(bad ? 1 : 0);
