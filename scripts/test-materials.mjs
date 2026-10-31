// Testy walidacji danych materiałów (bez przeglądarki). `node scripts/test-materials.mjs`
import { mkdtempSync, mkdirSync, writeFileSync, copyFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadMaterials, checkVideoUrl, renderSection, renderCovers } from './materials.mjs';

const results = [];
const check = (name, ok, info = '') => results.push(`${ok ? 'ok  ' : 'FAIL'} ${name}${info ? ' – ' + info : ''}`);
const base = {
  id: 'test-1', status: 'published', title: 'Tytuł', lead: 'Opis.', category: 'swiat', date: '2026-11-01',
  cover: 'c.jpg', youtube: 'https://www.youtube.com/watch?v=AAAAAAAAAAA', primary: 'youtube',
};
async function run(items) {
  const dir = mkdtempSync(join(tmpdir(), 'kx-'));
  mkdirSync(join(dir, 'okladki'));
  copyFileSync('content/przyklad/okladki/2026-11-03-inflacja.jpg', join(dir, 'okladki', 'c.jpg'));
  writeFileSync(join(dir, 'materialy.json'), JSON.stringify(items));
  try { return { items: await loadMaterials(dir), dir }; } catch (e) { return { error: e.message }; }
}
const expectError = async (name, patch, pattern) => {
  const r = await run([{ ...base, ...patch }]);
  check(name, r.error && pattern.test(r.error), r.error ? r.error.split('\n')[1] : 'brak błędu');
};

check('poprawny YouTube watch', checkVideoUrl('youtube', 'https://www.youtube.com/watch?v=AAAAAAAAAAA') === null);
check('poprawny YouTube shorts', checkVideoUrl('youtube', 'https://youtube.com/shorts/AAAAAAAAAAA') === null);
check('poprawny youtu.be', checkVideoUrl('youtube', 'https://youtu.be/AAAAAAAAAAA') === null);
check('odrzuca profil YouTube', checkVideoUrl('youtube', 'https://www.youtube.com/@kontekstowniktv') !== null);
check('odrzuca http', checkVideoUrl('youtube', 'http://www.youtube.com/watch?v=AAAAAAAAAAA') !== null);
check('poprawny TikTok', checkVideoUrl('tiktok', 'https://www.tiktok.com/@kontekstownik/video/7400000000000000001') === null);
check('odrzuca profil TikTok', checkVideoUrl('tiktok', 'https://www.tiktok.com/@kontekstownik') !== null);
check('odrzuca skracacz vm.tiktok', checkVideoUrl('tiktok', 'https://vm.tiktok.com/ZMabc/') !== null);

await expectError('zła kategoria', { category: 'sport' }, /category/);
await expectError('kategoria z prototypu (constructor)', { category: 'constructor' }, /category/);
await expectError('format z prototypu (constructor)', { format: 'constructor' }, /format/);
await expectError('tytuł nie-tekst', { title: 42 }, /title/);
await expectError('pusty tytuł (same spacje)', { title: '   ' }, /title/);
await expectError('okładka ze ścieżką ../', { cover: '../c.jpg' }, /bez ścieżki/);
await expectError('URL z loginem i portem', { youtube: 'https://u:p@www.youtube.com:8443/watch?v=AAAAAAAAAAA' }, /loginu/);
await expectError('related_id do siebie', { related_id: 'test-1' }, /related_id/);
await expectError('zła długość filmu', { duration_seconds: -5 }, /duration_seconds/);
{
  const r = await run([null]);
  check('pusty element listy daje komunikat, nie wyjątek', r.error && /oczekiwany obiekt/.test(r.error));
}
await expectError('nieistniejąca data', { date: '2026-02-30' }, /date/);
await expectError('brak okładki', { cover: 'brak.jpg' }, /cover: brak pliku/);
await expectError('primary bez linku', { primary: 'tiktok' }, /primary/);
await expectError('brak linków', { youtube: undefined }, /co najmniej jeden link/);
await expectError('złe id', { id: 'Zły ID' }, /id:/);
{
  const r = await run([{ ...base, cover: 'zly.jpg' }]);
  check('okładka w złym rozmiarze', r.error === undefined ? false : /brak pliku/.test(r.error));
}
{
  const dir = mkdtempSync(join(tmpdir(), 'kx-'));
  mkdirSync(join(dir, 'okladki'));
  copyFileSync('public/og-image.jpg', join(dir, 'okladki', 'c.jpg'));
  writeFileSync(join(dir, 'materialy.json'), JSON.stringify([base]));
  let msg = '';
  try { await loadMaterials(dir); } catch (e) { msg = e.message; }
  check('okładka 1200×630 odrzucona (wymagane 1920×1080)', /1200×630/.test(msg));
}
{
  const dir = mkdtempSync(join(tmpdir(), 'kx-'));
  mkdirSync(join(dir, 'okladki'));
  const sharp = (await import('sharp')).default;
  await sharp({ create: { width: 1920, height: 1080, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0.5 } } }).png().toFile(join(dir, 'okladki', 'c.png'));
  writeFileSync(join(dir, 'materialy.json'), JSON.stringify([{ ...base, cover: 'c.png' }]));
  let msg = '';
  try { await loadMaterials(dir); } catch (e) { msg = e.message; }
  check('okładka z przezroczystością odrzucona', /przezroczystości/.test(msg));
  writeFileSync(join(dir, 'okladki', 'z.jpg'), 'to nie jest obraz');
  writeFileSync(join(dir, 'materialy.json'), JSON.stringify([{ ...base, cover: 'z.jpg' }]));
  msg = '';
  try { await loadMaterials(dir); } catch (e) { msg = e.message; }
  check('uszkodzony plik okładki = komunikat walidacji', /nie da się odczytać/.test(msg));
}
{
  const r = await run([{ ...base, id: 'pelny', related_id: 'skrot' }, { ...base, id: 'skrot', format: 'short', related_id: 'pelny', primary: 'youtube' }]);
  await renderCovers(r.items, r.dir);
  const { section } = renderSection(r.items);
  check('etykiety Skrót i Pełny materiał', section.includes('>Skrót<') && section.includes('>Pełny materiał<'));
  check('etykiety na okładce ukryte przed czytnikiem (aria-hidden)', /card__badge" aria-hidden="true"/.test(section));
}
{
  const r = await run([base, { ...base }]);
  check('powtórzone id', r.error && /powtarza/.test(r.error));
}
{
  const r = await run([{ ...base, related_id: 'nie-ma' }]);
  check('related_id do nieistniejącego', r.error && /related_id/.test(r.error));
}
{
  const r = await run([{ ...base, title: '<img src=x onerror=alert(1)>' }, { ...base, id: 'szkic', status: 'draft' }]);
  await renderCovers(r.items, r.dir);
  const { section } = renderSection(r.items);
  check('szkic nie trafia na stronę', r.items.length === 1 && !section.includes('szkic'));
  check('HTML z danych jest escapowany', section.includes('&lt;img') && !section.includes('<img src=x'));
  check('brak iframe/embed w sekcji', !/<iframe|<embed|<video/.test(section));
}
{
  const r = await run([]);
  const out = renderSection(r.items);
  check('pusta lista = brak sekcji i strzałki', out.section === '' && out.hint === '');
}
console.log(results.join('\n'));
process.exit(results.some((r) => r.startsWith('FAIL')) ? 1 : 0);
