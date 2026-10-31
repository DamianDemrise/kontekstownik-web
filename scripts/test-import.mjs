// Testy importera na kopii repo (osobny katalog z własnym git) – prawdziwe content/ nie jest dotykane.
import { mkdtempSync, mkdirSync, cpSync, writeFileSync, readFileSync, copyFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';

const root = mkdtempSync(join(tmpdir(), 'kx-imp-'));
process.env.KONTEKSTOWNIK_ROOT = root;
const { importMaterial } = await import('./import-material.mjs');
const { renderPage } = await import('./materials-render.mjs');
const { loadMaterials, renderCovers } = await import('./materials.mjs');

const git = (...a) => execFileSync('git', a, { cwd: root, encoding: 'utf8' }).trim();
mkdirSync(join(root, 'content/okladki'), { recursive: true });
cpSync('content/okladki', join(root, 'content/okladki'), { recursive: true });
const existing = JSON.parse(readFileSync('content/materialy.json', 'utf8'));
existing[0].en = { title: 'EN title', lead: 'EN lead' };
writeFileSync(join(root, 'content/materialy.json'), JSON.stringify(existing, null, 2) + '\n');
git('init', '-q'); git('config', 'user.email', 'test@example.com'); git('config', 'user.name', 'test');
git('add', '-A'); git('commit', '-qm', 'baza');

const work = mkdtempSync(join(tmpdir(), 'kx-pkg-'));
copyFileSync('content/przyklad/okladki/2026-10-30-ustawa.jpg', join(work, 'okladka.jpg'));
const base = {
  schema: 'kontekstownik.material/1', approved: true, id: '2026-11-01-noc-w-trybunale', slug: 'noc-w-trybunale',
  title: 'Noc w Trybunale. Dlaczego Nawrocki przerwał lot do Senegalu?', lead: 'Co wydarzyło się w nocy i dlaczego (dane testowe).',
  category: 'Polityka', date: '2026-11-01', as_of: '2026-11-01', youtube: 'https://www.youtube.com/shorts/AAAAAAAAAAA',
  summary: ['Akapit testowy.'], transcript: ['Scena 1 (test).', 'Scena 2 (test).'],
  sources: [{ title: 'Komunikat (test)', publisher: 'Wydawca testowy', url: 'https://example.com/a' }], cover_h: 'okladka.jpg',
};
const pkg = (extra = {}) => { const f = join(work, `p-${Math.random().toString(36).slice(2)}.json`); writeFileSync(f, JSON.stringify({ ...base, ...extra })); return f; };
const data = () => JSON.parse(readFileSync(join(root, 'content/materialy.json'), 'utf8'));
const results = [];
const check = (name, ok, info = '') => results.push(`${ok ? 'ok  ' : 'FAIL'} ${name}${info ? ' – ' + info : ''}`);
const expectFail = async (name, p, re, opts) => { const before = readFileSync(join(root, 'content/materialy.json'), 'utf8'); try { await importMaterial(p, opts); check(name, false, 'brak błędu'); } catch (e) { check(name, re.test(e.message) && readFileSync(join(root, 'content/materialy.json'), 'utf8') === before, e.message.split('\n')[0]); } };

let r = await importMaterial(pkg({ cover_h: undefined }), { dryRun: true, cover: join(work, 'okladka.jpg') });
check('--cover: ścieżka względem bieżącego katalogu', r.status === 'created');
r = await importMaterial(pkg(), { dryRun: true });
check('dry-run: nic nie zapisuje', r.status === 'created' && data().length === existing.length);
r = await importMaterial(pkg(), { commit: true });
check('import: dodaje wpis i okładkę, osobny commit', r.status === 'created' && data().length === existing.length + 1 && /Materiał: Noc w Trybunale/.test(git('log', '-1', '--pretty=%s')) && git('status', '--porcelain') === '', r.url);
check('import: kategoria „Polityka” zmapowana, slug zachowany', data()[0].category === 'polityka' && r.url.endsWith('/materialy/noc-w-trybunale/'));
const head = git('rev-parse', 'HEAD');
r = await importMaterial(pkg(), { commit: true });
check('ponowienie: bez zmian, bez duplikatu i bez commita', r.status === 'unchanged' && data().length === existing.length + 1 && git('rev-parse', 'HEAD') === head);
r = await importMaterial(pkg({ lead: 'Nowy lead (dane testowe).' }), { commit: true });
check('aktualizacja: ten sam wpis uzupełniony', r.status === 'updated' && data().filter((m) => m.id === base.id).length === 1 && data()[0].lead.startsWith('Nowy'));
r = await importMaterial(pkg({ id: '2026-11-01-inne-id', slug: 'inny-slug' }), { commit: true });
check('ten sam film YouTube pod innym id: aktualizacja istniejącego, adres bez zmian', r.status !== 'created' && data().length === existing.length + 1 && r.url.endsWith('/noc-w-trybunale/'));
await expectFail('niezaakceptowany: odmowa', pkg({ approved: false }), /nie jest zaakceptowany/);
await expectFail('zły schemat: odmowa', pkg({ schema: 'x' }), /schema/);
await expectFail('nieznana kategoria: odmowa bez zmian w pliku', pkg({ category: 'Sport' }), /category/);
await expectFail('błąd walidacji (link do profilu) – nic nie zapisano', pkg({ youtube: 'https://www.youtube.com/@kontekstowniktv' }), /Walidacja nie przeszła/);
// Cudze niezacommitowane zmiany
const f = join(root, 'content/materialy.json');
writeFileSync(f, readFileSync(f, 'utf8') + '\n'); // ręczna, niezapisana zmiana kogoś innego
await expectFail('cudze niezacommitowane zmiany w materialy.json: odmowa', pkg({ lead: 'Jeszcze inny lead (test).' }), /Niezacommitowane zmiany/);
git('checkout', '--', 'content/materialy.json');
// EN zachowane przy aktualizacji istniejącego materiału ze Studio
const first = existing[0];
r = await importMaterial(pkg({ id: first.id, slug: undefined, title: first.title, lead: first.lead + ' ', youtube: first.youtube, tiktok: first.tiktok, category: first.category, date: first.date }), { commit: true });
const kept = data().find((m) => m.id === first.id);
check('aktualizacja istniejącego: wersja EN i slug nietknięte', kept.en?.title === 'EN title' && kept.slug === first.slug);
// Wydawca źródła na podstronie
const items = await loadMaterials(join(root, 'content'));
await renderCovers(items, join(root, 'content'));
const html = renderPage(items.find((m) => m.id === base.id), items, 'pl');
check('podstrona: wydawca źródła i tekst filmu', html.includes('Wydawca testowy') && html.includes('Scena 2 (test).'));
check('repo testowe czyste po testach (tylko commity importera)', git('status', '--porcelain') === '');

console.log(results.join('\n'));
process.exit(results.some((x) => x.startsWith('FAIL')) ? 1 : 0);
