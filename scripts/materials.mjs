// Sekcja „Najnowsze materiały”: wczytanie i walidacja content/materialy.json, okładki WebP, generowanie HTML kart.
// Używane przez plugin w vite.config.js (build i dev) oraz przez `npm run materialy:check`.
// Na stronie nie ma odtwarzaczy: karty to wyłącznie linki do YouTube / TikToka.
import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, basename } from 'node:path';
import sharp from 'sharp';

export const CATEGORIES = { polityka: 'Polityka', gospodarka: 'Gospodarka', spoleczenstwo: 'Społeczeństwo', swiat: 'Świat' };
export const COVER_WIDTHS = [480, 960, 1440];
const COVER_SIZE = { width: 1920, height: 1080 };
const FORMATS = new Set(['full', 'short']);
const PLATFORM = {
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
  }
  return files;
}

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const dateFmt = new Intl.DateTimeFormat('pl-PL', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });

function link(m, platform, cls, inner) {
  return `<a class="${cls}" href="${esc(m[platform])}" target="_blank" rel="noopener noreferrer" data-platform="${platform}" data-material="${esc(m.id)}" data-category="${esc(m.category)}">${inner}</a>`;
}

function card(m) {
  const p = PLATFORM[m.primary];
  const fmt = m.format === 'short' ? 'Skrót' : m.related_id ? 'Pełny materiał' : null;
  const srcset = COVER_WIDTHS.map((w) => `${m._cover[w]} ${w}w`).join(', ');
  const newTab = '<span class="visually-hidden"> (otwiera się w nowej karcie)</span>';
  const actions = Object.keys(PLATFORM).filter((k) => m[k]).map((k) =>
    link(m, k, `watch-link watch-link--${k === 'youtube' ? 'yt' : 'tt'}`,
      `${PLATFORM[k].cta}<span class="visually-hidden">: ${esc(m.title)}</span>${newTab}<span aria-hidden="true">↗</span>`)).join('');
  const main = link(m, m.primary, 'card__main',
    `<span class="card__cover"><img src="${m._cover[960]}" srcset="${srcset}" sizes="(max-width: 640px) calc(100vw - 32px), (max-width: 1000px) calc(50vw - 30px), (max-width: 1272px) calc(33vw - 30px), 395px" alt="${esc(m.cover_alt || '')}" width="1920" height="1080" loading="lazy" decoding="async">` +
    `<span class="card__badge" aria-hidden="true">${p.label} ↗</span>${fmt ? `<span class="card__format" aria-hidden="true">${fmt}</span>` : ''}</span>` +
    `<h3 class="card__title">${esc(m.title)}<span class="visually-hidden"> – ${p.label}${fmt ? `, ${fmt.toLowerCase()}` : ''}</span>${newTab}</h3>`);
  return `<li><article class="card">${main}` +
    `<p class="card__meta"><span class="card__cat">${CATEGORIES[m.category]}</span><span aria-hidden="true">·</span><time datetime="${m.date}">${dateFmt.format(new Date(`${m.date}T12:00:00Z`))}</time></p>` +
    `<p class="card__lead">${esc(m.lead)}</p><div class="card__actions">${actions}</div></article></li>`;
}

function newPill(m, count) {
  const more = count > 1 ? ` <span class="new-pill__more">+${count - 1}</span>` : '';
  return `<div class="new-pill" data-new-pill hidden>` +
    `<a class="new-pill__link" href="#materialy" data-new-pill-link>` +
    `<img class="new-pill__thumb" src="${m._cover[480]}" alt="" width="1920" height="1080" decoding="async">` +
    `<span class="new-pill__text"><span class="new-pill__label">Nowy materiał${more}</span>` +
    `<span class="new-pill__title">${esc(m.title)}</span></span>` +
    `<span class="new-pill__go" aria-hidden="true">↓</span>` +
    `<span class="visually-hidden">. Przewiń do najnowszych materiałów</span></a>` +
    `<button type="button" class="new-pill__close" data-new-pill-close aria-label="Ukryj powiadomienie o nowym materiale">×</button></div>`;
}

export function renderSection(items) {
  if (!items.length) return { hint: '', section: '' };
  return {
    // Przyklejony pasek o najnowszym materiale (pokazuje go new-pill.js; bez JS zostaje ukryty).
    hint: newPill(items[0], items.length),
    section: `<section class="materials" id="materialy" aria-labelledby="materialy-title"><div class="materials__inner">` +
      `<header class="materials__head"><h2 class="materials__title" id="materialy-title">Najnowsze materiały</h2>` +
      `<p class="materials__sub">Oglądaj na YouTube lub TikToku</p></header>` +
      `<ul class="materials__grid">${items.map(card).join('')}</ul></div></section>`,
  };
}
