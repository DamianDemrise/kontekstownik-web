// Materiały wideo: wczytanie i walidacja content/materialy.json oraz okładki (WebP + grafika OG).
// HTML (karty, pasek, podstrony, sitemap) generuje materials-render.mjs. Na stronie nie ma odtwarzaczy.
import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, basename } from 'node:path';
import sharp from 'sharp';

// Kategorie tematyczne = 7 kategorii Studio (te same klucze, bez mapowania). `spoleczenstwo` i `swiat` zostają
// tylko dla zgodności starszych wpisów; Polska/Świat będzie osobnym podziałem geograficznym, nie kategorią.
export const CATEGORIES = {
  polityka: 'Polityka', gospodarka: 'Gospodarka', wydarzenia: 'Wydarzenia', medycyna: 'Medycyna',
  katastrofy: 'Katastrofy', motoryzacja: 'Motoryzacja', technologia: 'Technologia',
  spoleczenstwo: 'Społeczeństwo', swiat: 'Świat',
};
export const CATEGORIES_EN = {
  polityka: 'Politics', gospodarka: 'Economy', wydarzenia: 'Events', medycyna: 'Health',
  katastrofy: 'Disasters', motoryzacja: 'Automotive', technologia: 'Technology',
  spoleczenstwo: 'Society', swiat: 'World',
};
export const LEGACY_CATEGORIES = ['spoleczenstwo', 'swiat'];
export const COVER_WIDTHS = [480, 960, 1440];
const COVER_SIZE = { width: 1920, height: 1080 };
const FORMATS = new Set(['full', 'short']);
export const PLATFORM = {
  youtube: { label: 'YouTube', cta: 'Obejrzyj na YouTube' },
  tiktok: { label: 'TikTok', cta: 'Obejrzyj na TikToku' },
};

export function contentDir() {
  return process.env.MATERIALY_DIR || 'content';
}

// Dozwolone są wyłącznie adresy konkretnych filmów (nie profile, nie skracacze inne niż youtu.be).
export function checkVideoUrl(platform, raw) {
  let u;
  try { u = new URL(raw); } catch { return 'nieprawidłowy URL'; }
  if (u.protocol !== 'https:') return 'wymagany https';
  if (u.username || u.password || u.port) return 'adres nie może zawierać loginu, hasła ani portu';
  if (platform === 'youtube') {
    const id = /^[\w-]{11}$/;
    if (['www.youtube.com', 'youtube.com', 'm.youtube.com'].includes(u.hostname)) {
      if (u.pathname === '/watch' && id.test(u.searchParams.get('v') || '')) return null;
      const m = u.pathname.match(/^\/(shorts|live)\/([\w-]{11})\/?$/);
      if (m) return null;
      return 'to nie jest adres konkretnego filmu YouTube (watch?v=…, shorts/…, live/…)';
    }
    if (u.hostname === 'youtu.be' && id.test(u.pathname.slice(1))) return null;
    return 'dozwolone hosty: youtube.com, youtu.be';
  }
  if (platform === 'tiktok') {
    if (u.hostname !== 'www.tiktok.com') return 'dozwolony host: www.tiktok.com';
    if (/^\/@[\w.]+\/video\/\d{10,25}\/?$/.test(u.pathname)) return null;
    return 'to nie jest adres konkretnego filmu TikTok (/@konto/video/…)';
  }
  return 'nieznana platforma';
}

// Źródła: dowolna strona https, bez loginu/hasła/portu.
export function checkSourceUrl(raw) {
  let u;
  try { u = new URL(raw); } catch { return 'nieprawidłowy URL'; }
  if (u.protocol !== 'https:') return 'wymagany https';
  if (u.username || u.password || u.port) return 'adres nie może zawierać loginu, hasła ani portu';
  return null;
}

function isRealDate(s) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s || '')) return false;
  const d = new Date(`${s}T12:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

// Zwraca opublikowane materiały (najnowsze pierwsze). Każdy błąd danych przerywa build z listą problemów.
export async function loadMaterials(dir = contentDir()) {
  const file = join(dir, 'materialy.json');
  if (!existsSync(file)) return [];
  let items;
  try { items = JSON.parse(readFileSync(file, 'utf8')); } catch (e) { throw new Error(`${file}: niepoprawny JSON (${e.message})`); }
  if (!Array.isArray(items)) throw new Error(`${file}: oczekiwana tablica materiałów`);

  const errors = [];
  const ids = new Set();
  const text = (v, max) => typeof v === 'string' && v.trim().length > 0 && v.length <= max;
  const has = (obj, k) => typeof k === 'string' && Object.hasOwn(obj, k);
  for (const [i, m] of items.entries()) {
    if (!m || typeof m !== 'object' || Array.isArray(m)) { errors.push(`materiał #${i + 1}: oczekiwany obiekt`); continue; }
    const at = `materiał #${i + 1} (${typeof m.id === 'string' ? m.id : 'bez id'})`;
    const err = (msg) => errors.push(`${at}: ${msg}`);
    if (typeof m.id !== 'string' || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(m.id)) err('id: małe litery, cyfry i myślniki');
    else if (ids.has(m.id)) err('id się powtarza');
    else ids.add(m.id);
    if (!['published', 'draft'].includes(m.status)) err('status: published albo draft');
    if (!text(m.title, 120)) err('title: niepusty tekst, max 120 znaków');
    if (!text(m.lead, 200)) err('lead: niepusty tekst, max 200 znaków');
    if (!has(CATEGORIES, m.category)) err(`category: jedna z ${Object.keys(CATEGORIES).join(', ')}`);
    if (!isRealDate(m.date)) err('date: RRRR-MM-DD, prawdziwa data publikacji');
    if (m.format !== undefined && !FORMATS.has(m.format)) err('format: full albo short');
    if (m.duration_seconds !== undefined && !(Number.isInteger(m.duration_seconds) && m.duration_seconds > 0)) err('duration_seconds: dodatnia liczba całkowita');
    if (m.cover_alt !== undefined && typeof m.cover_alt !== 'string') err('cover_alt: tekst (może być pusty)');
    if (m.related_id !== undefined && (typeof m.related_id !== 'string' || m.related_id === m.id)) err('related_id: id innego materiału');
    // Podstrona materiału: adres, opis, źródła, stan informacji, nota (np. o użyciu AI)
    if (m.slug !== undefined && (typeof m.slug !== 'string' || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(m.slug) || m.slug.length > 80)) err('slug: małe litery, cyfry i myślniki, max 80 znaków');
    if (m.summary !== undefined && !(Array.isArray(m.summary) && m.summary.length >= 1 && m.summary.length <= 8 && m.summary.every((t) => text(t, 1200)))) err('summary: 1–8 akapitów, każdy niepusty tekst do 1200 znaków');
    if (m.sources !== undefined) {
      if (!Array.isArray(m.sources) || m.sources.length > 20) err('sources: lista do 20 pozycji');
      else m.sources.forEach((src, k) => {
        if (!src || !text(src.title, 200)) err(`sources[${k}].title: niepusty tekst do 200 znaków`);
        if (src?.publisher !== undefined && !text(src.publisher, 120)) err(`sources[${k}].publisher: niepusty tekst do 120 znaków`);
        const e = checkSourceUrl(src?.url);
        if (e) err(`sources[${k}].url: ${e}`);
      });
    }
    if (m.as_of !== undefined && !isRealDate(m.as_of)) err('as_of: RRRR-MM-DD');
    // „W skrócie” (2–5 punktów) i tekst filmu (akapity lektora) – tylko z zatwierdzonego scenariusza
    const pts = (v) => Array.isArray(v) && v.length >= 2 && v.length <= 5 && v.every((x) => text(x, 160));
    const paras = (v) => Array.isArray(v) && v.length >= 1 && v.length <= 60 && v.every((x) => text(x, 1500));
    if (m.key_points !== undefined && !pts(m.key_points)) err('key_points: 2–5 punktów, każdy do 160 znaków');
    if (m.transcript !== undefined && !paras(m.transcript)) err('transcript: 1–60 akapitów, każdy do 1500 znaków');
    if (m.series !== undefined && (typeof m.series !== 'string' || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(m.series))) err('series: identyfikator serii/wątku, np. trybunal-konstytucyjny');
    if (m.note !== undefined && !text(m.note, 300)) err('note: niepusty tekst do 300 znaków');
    // Oś czasu „Jak do tego doszło”: tylko zweryfikowane wydarzenia, każde może wskazać źródło
    if (m.timeline !== undefined) {
      if (!Array.isArray(m.timeline) || m.timeline.length < 2 || m.timeline.length > 15) err('timeline: 2–15 wydarzeń');
      else m.timeline.forEach((ev, k) => {
        if (!ev || !/^\d{4}(-(0[1-9]|1[0-2])(-\d{2})?)?$/.test(ev.date || '') || (ev.date.length === 10 && !isRealDate(ev.date))) err(`timeline[${k}].date: RRRR, RRRR-MM albo RRRR-MM-DD`);
        if (!text(ev?.text, 220)) err(`timeline[${k}].text: niepusty tekst do 220 znaków`);
        if (ev?.source !== undefined) { const e = checkSourceUrl(ev.source); if (e) err(`timeline[${k}].source: ${e}`); }
      });
    }
    // Wersja angielska (opcjonalna): bez niej materiał nie pojawia się na /en/
    if (m.en !== undefined) {
      const en = m.en;
      if (!en || typeof en !== 'object' || Array.isArray(en)) err('en: obiekt z tłumaczeniem');
      else {
        if (!text(en.title, 120)) err('en.title: niepusty tekst, max 120 znaków');
        if (!text(en.lead, 200)) err('en.lead: niepusty tekst, max 200 znaków');
        if (en.summary !== undefined && !(Array.isArray(en.summary) && en.summary.length >= 1 && en.summary.length <= 8 && en.summary.every((t) => text(t, 1200)))) err('en.summary: 1–8 akapitów do 1200 znaków');
        if (en.note !== undefined && !text(en.note, 300)) err('en.note: niepusty tekst do 300 znaków');
        if (en.timeline !== undefined && !(Array.isArray(en.timeline) && Array.isArray(m.timeline) && en.timeline.length === m.timeline.length && en.timeline.every((t) => text(t, 220)))) err('en.timeline: lista tekstów tej samej długości co timeline');
        if (en.key_points !== undefined && !(Array.isArray(en.key_points) && en.key_points.length >= 2 && en.key_points.length <= 5 && en.key_points.every((x) => text(x, 160)))) err('en.key_points: 2–5 punktów do 160 znaków');
        if (en.transcript !== undefined && !(Array.isArray(en.transcript) && en.transcript.length >= 1 && en.transcript.length <= 60 && en.transcript.every((x) => text(x, 1500)))) err('en.transcript: 1–60 akapitów do 1500 znaków');
        if (en.slug !== undefined && (typeof en.slug !== 'string' || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(en.slug) || en.slug.length > 80)) err('en.slug: małe litery, cyfry i myślniki, max 80 znaków');
        const extra = Object.keys(en).filter((k) => !['title', 'lead', 'summary', 'note', 'slug', 'timeline', 'key_points', 'transcript'].includes(k));
        if (extra.length) err(`en: nieznane pola ${extra.join(', ')}`);
      }
    }
    const platforms = Object.keys(PLATFORM).filter((p) => m[p] !== undefined);
    if (!platforms.length) err('wymagany co najmniej jeden link: youtube albo tiktok');
    for (const p of platforms) { const e = typeof m[p] === 'string' ? checkVideoUrl(p, m[p]) : 'oczekiwany tekst'; if (e) err(`${p}: ${e}`); }
    if (!platforms.includes(m.primary)) err('primary: musi wskazywać platformę, która ma link');
    // Okładka: sama nazwa pliku z content/okladki/, prawdziwy JPEG/PNG 1920×1080, sRGB, bez przezroczystości.
    if (typeof m.cover !== 'string' || m.cover !== basename(m.cover) || !/^[\w.-]+\.(jpe?g|png)$/i.test(m.cover)) { err('cover: sama nazwa pliku .jpg/.png (bez ścieżki)'); continue; }
    const cover = join(dir, 'okladki', m.cover);
    if (!existsSync(cover)) { err(`cover: brak pliku content/okladki/${m.cover}`); continue; }
    try {
      const meta = await sharp(cover).metadata();
      if (!['jpeg', 'png'].includes(meta.format)) err(`cover: plik jest w formacie ${meta.format}, wymagany JPEG albo PNG`);
      if (meta.width !== COVER_SIZE.width || meta.height !== COVER_SIZE.height) err(`cover: ${meta.width}×${meta.height}, wymagane 1920×1080`);
      if (meta.hasAlpha) err('cover: obraz ma kanał przezroczystości, wymagany bez');
      if (meta.space && meta.space !== 'srgb') err(`cover: przestrzeń barw ${meta.space}, wymagana sRGB`);
    } catch (e) { err(`cover: nie da się odczytać obrazu (${e.message})`); }
  }
  const slugs = new Map();
  for (const m of items) {
    if (!m || typeof m !== 'object' || typeof m.id !== 'string') continue;
    m.slug ??= m.id.replace(/^\d{4}-\d{2}-\d{2}-/, '');
    if (slugs.has(m.slug)) errors.push(`materiał ${m.id}: slug „${m.slug}” zajęty przez ${slugs.get(m.slug)}`);
    slugs.set(m.slug, m.id);
  }
  for (const m of items) if (m && typeof m.related_id === 'string' && m.related_id !== m.id && !ids.has(m.related_id)) errors.push(`materiał ${m.id}: related_id wskazuje nieistniejący materiał`);
  if (errors.length) throw new Error(`Błędy w ${file}:\n- ${errors.join('\n- ')}`);

  return items
    .filter((m) => m.status === 'published')
    .sort((a, b) => b.date.localeCompare(a.date) || a.id.localeCompare(b.id));
}

// Okładki: WebP w 3 szerokościach, hash treści w nazwie (bezpieczny długi cache).
export async function renderCovers(items, dir = contentDir()) {
  const files = [];
  for (const m of items) {
    const src = readFileSync(join(dir, 'okladki', m.cover));
    const hash = createHash('sha256').update(src).digest('hex').slice(0, 8);
    m._cover = {};
    for (const w of COVER_WIDTHS) {
      const fileName = `okladki/${m.id}-${hash}-${w}.webp`;
      m._cover[w] = `/${fileName}`;
      files.push({ fileName, render: () => sharp(src).resize(w).webp({ quality: 80 }).toBuffer() });
    }
    // Grafika podglądu linku podstrony (Open Graph): 1200×630, kadr ze środka okładki
    const og = `okladki/${m.id}-${hash}-og.jpg`;
    m._cover.og = `/${og}`;
    files.push({ fileName: og, render: () => sharp(src).resize(1200, 630, { fit: 'cover' }).jpeg({ quality: 86, mozjpeg: true }).toBuffer() });
  }
  return files;
}
