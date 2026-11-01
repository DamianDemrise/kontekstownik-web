import { readFile, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import sharp from 'sharp';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../..');
const categories = {
  polityka: ['Polityka', 'instytucje'],
  gospodarka: ['Gospodarka', 'obieg'],
  wydarzenia: ['Wydarzenia', 'globus'],
  medycyna: ['Medycyna', 'relacje'],
  katastrofy: ['Katastrofy', 'globus'],
  motoryzacja: ['Motoryzacja', 'obieg'],
  technologia: ['Technologia', 'obieg'],
  spoleczenstwo: ['Społeczeństwo', 'relacje'],
  swiat: ['Świat', 'globus'],
};
const help = `Eksport okładki 1920×1080 JPEG sRGB.
node content/szablon-okladki/eksport.mjs --id temat --naglowek "Jak powstaje nowa ustawa" --kategoria polityka --out content/szablon-okladki/probki
Albo: --json plik.json (obiekt lub tablica obiektów).
Pola JSON: id, nagłówek (lub naglowek), kategoria, motyw (opcjonalny).
Motywy: instytucje, obieg, relacje, globus. Domyślnie według kategorii.
--out katalog: domyślnie content/okladki względem katalogu projektu.
Ścieżki jawnych --out i --json są względem bieżącego katalogu.
--chrome ścieżka: domyślnie systemowy Google Chrome na macOS.`;

function argumentsOf(args) {
  const result = {};
  const allowed = new Set(['id', 'naglowek', 'nagłówek', 'kategoria', 'motyw', 'json', 'out', 'chrome']);
  for (let i = 0; i < args.length; i++) {
    const key = args[i].slice(2);
    if (!args[i].startsWith('--') || !allowed.has(key)) throw Error(`Nieznany argument: ${args[i]}`);
    if (Object.hasOwn(result, key)) throw Error(`Powtórzony argument: --${key}`);
    const value = args[++i];
    if (!value || value.startsWith('--')) throw Error(`Brak wartości --${key}`);
    result[key] = value;
  }
  if (result.json && ['id', 'naglowek', 'nagłówek', 'kategoria', 'motyw'].some(key => key in result)) {
    throw Error('Użyj pliku JSON albo pól w argumentach, nie obu naraz.');
  }
  return result;
}

function validate(item) {
  if (!item || typeof item !== 'object' || Array.isArray(item)) throw Error('Wpis musi być obiektem.');
  if (typeof item.id !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(item.id)) throw Error('Nieprawidłowe id.');
  const headline = item['nagłówek'] ?? item.naglowek;
  if (typeof headline !== 'string' || /[\r\n\p{Cc}\p{Cf}]/u.test(headline)) throw Error(`${item.id}: nieprawidłowy nagłówek.`);
  const title = headline.trim().replace(/\s+/gu, ' ');
  const count = title.split(' ').length;
  if (count < 2 || count > 6) throw Error(`${item.id}: nagłówek musi mieć 2–6 słów.`);
  if (!Object.hasOwn(categories, item.kategoria)) throw Error(`${item.id}: nieznana kategoria.`);
  const [label, defaultMotif] = categories[item.kategoria];
  const motif = item.motyw ?? defaultMotif;
  if (!Object.values(categories).some(([, value]) => value === motif)) throw Error(`${item.id}: nieznany motyw.`);
  return { id: item.id, title, label, motif };
}

async function main() {
  if (process.argv.includes('--help')) { console.log(help); return; }
  const options = argumentsOf(process.argv.slice(2));
  const input = options.json ? JSON.parse(await readFile(path.resolve(options.json), 'utf8')) : options;
  const items = (Array.isArray(input) ? input : [input]).map(validate);
  if (!items.length) throw Error('Lista okładek jest pusta.');
  if (new Set(items.map(item => item.id)).size !== items.length) throw Error('Powtórzone id w zestawie.');
  let css = await readFile(path.join(here, 'styl.css'), 'utf8');
  for (const name of ['montserrat-latin-v2.woff2', 'montserrat-latin-ext-v2.woff2']) {
    const bytes = await readFile(path.join(root, 'public/fonts', name));
    css = css.replace(`../../public/fonts/${name}`, `data:font/woff2;base64,${bytes.toString('base64')}`);
  }
  const html = (await readFile(path.join(here, 'szablon.html'), 'utf8'))
    .replace('<link rel="stylesheet" href="styl.css">', `<style>${css}</style>`);
  const out = options.out ? path.resolve(options.out) : path.join(root, 'content/okladki');
  const browser = await chromium.launch({
    executablePath: options.chrome ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true,
    // Playwright 1.48 dodaje headless=old, usunięte z nowszego Chrome.
    ignoreDefaultArgs: ['--headless=old'],
    args: ['--headless=new', '--force-color-profile=srgb'],
  });
  try {
    const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
    await page.setContent(html);
    // Sprawdź cały zestaw przed pierwszym zapisem obrazu.
    for (const item of items) {
      await page.evaluate(async ({ title, label, motif }) => {
        document.querySelector('h1').textContent = title;
        document.querySelector('.kategoria').textContent = label;
        document.querySelector('.okladka').dataset.motyw = motif;
        // Wymuś oba podzbiory również przy nagłówku bez polskich znaków.
        await document.fonts.load('800 120px Montserrat', `${title} Zażółć gęślą jaźń`);
        await document.fonts.load('700 34px Montserrat', `${label} Zażółć gęślą jaźń`);
        await document.fonts.ready;
        if ([...document.fonts].some(font => font.status !== 'loaded')) throw Error('Nie załadowano fontów Montserrat.');
        const heading = document.querySelector('h1');
        const bounds = heading.getBoundingClientRect();
        const range = document.createRange();
        range.selectNodeContents(heading);
        const rects = [...range.getClientRects()];
        const lines = new Set(rects.map(rect => Math.round(rect.top)));
        if (lines.size > 2 || bounds.height > 2 * parseFloat(getComputedStyle(heading).lineHeight) + 1 ||
            rects.some(rect => rect.right > bounds.right + 1) || bounds.bottom > 740) {
          throw Error('Nagłówek nie mieści się w dwóch liniach. Skróć tekst.');
        }
      }, item).catch(error => { throw Error(`${item.id}: ${error.message}`); });
    }
    await mkdir(out, { recursive: true });
    for (const item of items) {
      await page.evaluate(({ title, label, motif }) => {
        document.querySelector('h1').textContent = title;
        document.querySelector('.kategoria').textContent = label;
        document.querySelector('.okladka').dataset.motyw = motif;
      }, item);
      const bytes = await page.screenshot({ type: 'png', animations: 'disabled' });
      const jpeg = await sharp(bytes).flatten({ background: '#080D12' }).toColourspace('srgb')
        .withIccProfile('srgb').jpeg({ quality: 94, chromaSubsampling: '4:4:4' }).toBuffer();
      const destination = path.join(out, `${item.id}.jpg`);
      await writeFile(destination, jpeg);
      console.log(destination);
    }
  } finally { await browser.close(); }
}

main().catch(error => { console.error(`Błąd: ${error.message}`); process.exitCode = 1; });
