// Importer materiału ze Studio KONTEKSTOWNIK: paczka JSON (schemat kontekstownik.material/1) + okładka pozioma 1920×1080.
// Dodaje albo uzupełnia wpis w content/materialy.json i okładkę w content/okladki/ – idempotentnie (ponowienie = bez zmian).
//
//   node scripts/import-material.mjs paczka.json [--cover okladka.jpg] [--dry-run] [--commit] [--publish] [--json]
//
//   --dry-run   tylko walidacja i podgląd zmian, nic nie zapisuje
//   --commit    commit wyłącznie zmienionych plików materiału (osobny od innych zmian)
//   --publish   commit + build z walidacją + git push (= publikacja na stronie); tylko dla zaakceptowanych paczek
//   --json      wynik jako JSON na stdout (dla Studio)
//
// Zabezpieczenia: paczka musi mieć "approved": true; importer odmawia, gdy content/materialy.json albo plik okładki ma
// niezacommitowane zmiany kogoś innego; walidacja całego pliku na kopii przed zapisem; blokada przed równoległym uruchomieniem.
import { readFileSync, writeFileSync, copyFileSync, existsSync, mkdirSync, mkdtempSync, renameSync, rmSync, cpSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join, dirname, resolve, extname } from 'node:path';
import { loadMaterials, CATEGORIES } from './materials.mjs';

const ROOT = resolve(process.env.KONTEKSTOWNIK_ROOT || join(import.meta.dirname, '..'));
const CONTENT = join(ROOT, 'content');
const DATA = join(CONTENT, 'materialy.json');
const SCHEMA = 'kontekstownik.material/1';

// Kategorie Studio przechodzą 1:1 (te same klucze co strona). Aliasy tylko dla pisowni/angielskich nazw tej samej kategorii.
const CATEGORY_MAP = {
  ...Object.fromEntries(Object.keys(CATEGORIES).map((c) => [c, c])),
  politics: 'polityka', ekonomia: 'gospodarka', economy: 'gospodarka', events: 'wydarzenia', health: 'medycyna',
  medicine: 'medycyna', disasters: 'katastrofy', automotive: 'motoryzacja', technology: 'technologia',
  'społeczeństwo': 'spoleczenstwo', society: 'spoleczenstwo', 'świat': 'swiat', world: 'swiat',
};
// Pola paczki przepisywane 1:1 do wpisu (pozostałe ignorujemy, żeby Studio nie nadpisało np. wersji EN).
const COPY = ['title', 'lead', 'date', 'as_of', 'youtube', 'tiktok', 'primary', 'format', 'duration_seconds',
  'summary', 'key_points', 'transcript', 'sources', 'note', 'series', 'timeline', 'related_id', 'cover_alt'];

class ImportError extends Error {}
const fail = (msg) => { throw new ImportError(msg); };
const git = (...args) => execFileSync('git', args, { cwd: ROOT, encoding: 'utf8' }).trim();
const sha = (buf) => createHash('sha256').update(buf).digest('hex');
const ytId = (u) => { try { const x = new URL(u); return x.hostname === 'youtu.be' ? x.pathname.slice(1) : x.searchParams.get('v') || x.pathname.split('/')[2]; } catch { return null; } };

function parseArgs(argv) {
  const opts = { flags: new Set() };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--cover') opts.cover = argv[++i];
    else if (a.startsWith('--')) opts.flags.add(a.slice(2));
    else opts.pkg = a;
  }
  if (!opts.pkg) fail('Brak ścieżki do paczki JSON. Użycie: node scripts/import-material.mjs paczka.json [--cover plik] [--dry-run|--commit|--publish]');
  return opts;
}

// Paczka Studio -> wpis strony (bez okładki).
export function toEntry(pkg) {
  if (!pkg || typeof pkg !== 'object') fail('Paczka nie jest obiektem JSON');
  if (pkg.schema !== SCHEMA) fail(`schema: oczekiwano "${SCHEMA}"`);
  if (pkg.approved !== true) fail('Materiał nie jest zaakceptowany (approved: true) – nie importuję');
  if (typeof pkg.id !== 'string') fail('id: wymagany');
  const key = String(pkg.category || '').toLowerCase().trim();
  const category = Object.hasOwn(CATEGORY_MAP, key) ? CATEGORY_MAP[key] : undefined;
  if (!category) fail(`category: „${pkg.category}” – dozwolone: ${Object.keys(CATEGORIES).join(', ')}`);
  const entry = { id: pkg.id, status: 'published', category };
  if (pkg.slug !== undefined) entry.slug = pkg.slug;
  for (const k of COPY) if (pkg[k] !== undefined) entry[k] = pkg[k];
  entry.primary ??= entry.youtube ? 'youtube' : 'tiktok';
  return entry;
}

// Scalenie z istniejącym wpisem: nowe pola wygrywają, ale adres (slug), wersja EN i powiązania zostają.
export function merge(existing, incoming) {
  const out = { ...existing, ...incoming };
  if (existing.slug) out.slug = existing.slug;
  if (existing.en) out.en = existing.en;
  if (existing.id !== incoming.id) out.id = existing.id; // ten sam film YouTube pod innym id – zostaje pierwotne
  return out;
}

function findExisting(list, entry) {
  const byId = list.findIndex((m) => m.id === entry.id);
  if (byId > -1) return byId;
  const vid = entry.youtube && ytId(entry.youtube);
  return vid ? list.findIndex((m) => m.youtube && ytId(m.youtube) === vid) : -1;
}

function dirtyPaths(paths) {
  if (!existsSync(join(ROOT, '.git'))) return [];
  const out = git('status', '--porcelain', '--', ...paths.map((p) => p.replace(ROOT + '/', '')));
  return out ? out.split('\n').map((l) => l.slice(3)) : [];
}

export async function importMaterial(pkgPath, { cover, dryRun = false, commit = false, publish = false } = {}) {
  const pkgFile = resolve(pkgPath);
  let pkg;
  try { pkg = JSON.parse(readFileSync(pkgFile, 'utf8')); } catch (e) { fail(`Nie da się odczytać paczki: ${e.message}`); }
  const incoming = toEntry(pkg);

  // --cover: względem bieżącego katalogu (jak każdy argument); cover_h z paczki: względem pliku paczki
  const coverSrc = cover ? resolve(cover) : resolve(dirname(pkgFile), pkg.cover_h || '');
  if (!cover && !pkg.cover_h) fail('Brak okładki poziomej: pole cover_h w paczce albo --cover');
  if (!existsSync(coverSrc)) fail(`Okładka nie istnieje: ${coverSrc}`);
  const ext = extname(coverSrc).toLowerCase().replace('.jpeg', '.jpg');
  if (!['.jpg', '.png'].includes(ext)) fail('Okładka: JPEG albo PNG');

  const list = existsSync(DATA) ? JSON.parse(readFileSync(DATA, 'utf8')) : [];
  const idx = findExisting(list, incoming);
  const before = idx > -1 ? list[idx] : null;
  const entry = before ? merge(before, incoming) : incoming;
  const coverName = `${entry.id}${ext}`;
  entry.cover = coverName;
  const coverDst = join(CONTENT, 'okladki', coverName);

  // Cudze niezacommitowane zmiany w plikach, które importer by nadpisał -> odmowa.
  const dirty = dirtyPaths([DATA, coverDst]);
  if (dirty.length) fail(`Niezacommitowane zmiany w: ${dirty.join(', ')} – najpierw je zapisz albo wycofaj (importer ich nie nadpisze)`);

  const next = idx > -1 ? list.map((m, i) => (i === idx ? entry : m)) : [entry, ...list];
  const nextJson = JSON.stringify(next, null, 2) + '\n';
  const coverBuf = readFileSync(coverSrc);
  const dataChanged = !existsSync(DATA) || readFileSync(DATA, 'utf8') !== nextJson;
  const coverChanged = !existsSync(coverDst) || sha(readFileSync(coverDst)) !== sha(coverBuf);
  const result = { status: !before ? 'created' : dataChanged || coverChanged ? 'updated' : 'unchanged', id: entry.id, slug: null, url: null, commit: null };

  // Walidacja całości na kopii (okładki + nowy JSON) – dopiero potem zapis do repo.
  const tmp = mkdtempSync(join(tmpdir(), 'kx-import-'));
  try {
    mkdirSync(join(tmp, 'okladki'), { recursive: true });
    if (existsSync(join(CONTENT, 'okladki'))) cpSync(join(CONTENT, 'okladki'), join(tmp, 'okladki'), { recursive: true });
    copyFileSync(coverSrc, join(tmp, 'okladki', coverName));
    writeFileSync(join(tmp, 'materialy.json'), nextJson);
    const published = await loadMaterials(tmp);
    const m = published.find((x) => x.id === entry.id);
    result.slug = m.slug;
    result.url = `https://www.kontekstownik.pl/materialy/${m.slug}/`;
  } catch (e) {
    fail(`Walidacja nie przeszła, nic nie zapisano:\n${e.message}`);
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
  if (dryRun || result.status === 'unchanged') return result;

  // Zapis atomowy: plik tymczasowy obok i rename.
  const lock = join(ROOT, '.import.lock');
  try { mkdirSync(lock); } catch { fail('Inny import jest w toku (.import.lock) – spróbuj za chwilę'); }
  try {
    mkdirSync(join(CONTENT, 'okladki'), { recursive: true });
    if (coverChanged) { writeFileSync(coverDst + '.tmp', coverBuf); renameSync(coverDst + '.tmp', coverDst); }
    if (dataChanged) { writeFileSync(DATA + '.tmp', nextJson); renameSync(DATA + '.tmp', DATA); }
    if (commit || publish) {
      const paths = ['content/materialy.json', `content/okladki/${coverName}`];
      git('add', '--', ...paths);
      git('commit', '-m', `Materiał: ${entry.title}\n\nImport ze Studio (${result.status}), id ${entry.id}.`, '--', ...paths);
      result.commit = git('rev-parse', '--short', 'HEAD');
      if (publish) {
        execFileSync('npm', ['run', 'build'], { cwd: ROOT, stdio: 'pipe' }); // walidacja + check-dist przed publikacją
        git('push');
      }
    }
  } finally {
    rmSync(lock, { recursive: true, force: true });
  }
  return result;
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(import.meta.filename)) {
  const asJson = process.argv.includes('--json');
  try {
    const o = parseArgs(process.argv.slice(2));
    const r = await importMaterial(o.pkg, { cover: o.cover, dryRun: o.flags.has('dry-run'), commit: o.flags.has('commit'), publish: o.flags.has('publish') });
    if (asJson) console.log(JSON.stringify({ ok: true, ...r }));
    else console.log(`${{ created: 'Dodano', updated: 'Zaktualizowano', unchanged: 'Bez zmian' }[r.status]}: ${r.id} → ${r.url}${r.commit ? ` (commit ${r.commit})` : ''}`);
  } catch (e) {
    if (asJson) console.log(JSON.stringify({ ok: false, error: e.message }));
    else console.error(`Błąd: ${e.message}`);
    process.exit(e instanceof ImportError ? 2 : 1);
  }
}
