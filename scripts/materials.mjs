// Sekcja „Najnowsze materiały”: wczytanie i walidacja content/materialy.json, okładki WebP, generowanie HTML kart.
// Używane przez plugin w vite.config.js (build i dev) oraz przez `npm run materialy:check`.
// Na stronie nie ma odtwarzaczy: karty to wyłącznie linki do YouTube / TikToka.
import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import sharp from 'sharp';

export const CATEGORIES = { polityka: 'Polityka', gospodarka: 'Gospodarka', spoleczenstwo: 'Społeczeństwo', swiat: 'Świat' };
export const COVER_WIDTHS = [480, 960, 1440];
const COVER_SIZE = { width: 1920, height: 1080 };
const FORMATS = { full: null, short: 'Skrót' };
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
  for (const [i, m] of items.entries()) {
    const at = `materiał #${i + 1} (${m?.id || 'bez id'})`;
    const err = (msg) => errors.push(`${at}: ${msg}`);
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(m.id || '')) err('id: małe litery, cyfry i myślniki');
    if (ids.has(m.id)) err('id się powtarza');
    ids.add(m.id);
    if (!['published', 'draft'].includes(m.status)) err('status: published albo draft');
    if (!m.title || m.title.length > 120) err('title: wymagany, max 120 znaków');
    if (!m.lead || m.lead.length > 200) err('lead: wymagany, max 200 znaków');
    if (!CATEGORIES[m.category]) err(`category: jedna z ${Object.keys(CATEGORIES).join(', ')}`);
    if (!isRealDate(m.date)) err('date: RRRR-MM-DD, prawdziwa data publikacji');
    if (m.format !== undefined && !(m.format in FORMATS)) err('format: full albo short');
    if (m.cover_alt !== undefined && typeof m.cover_alt !== 'string') err('cover_alt: tekst (może być pusty)');
    const platforms = Object.keys(PLATFORM).filter((p) => m[p]);
    if (!platforms.length) err('wymagany co najmniej jeden link: youtube albo tiktok');
    for (const p of platforms) { const e = checkVideoUrl(p, m[p]); if (e) err(`${p}: ${e}`); }
    if (!platforms.includes(m.primary)) err('primary: musi wskazywać platformę, która ma link');
    const cover = join(dir, 'okladki', m.cover || '');
    if (!m.cover || !/\.(jpe?g|png)$/i.test(m.cover) || !existsSync(cover)) err(`cover: brak pliku content/okladki/${m.cover || '?'} (jpg/png)`);
    else {
      const meta = await sharp(cover).metadata();
      if (meta.width !== COVER_SIZE.width || meta.height !== COVER_SIZE.height) err(`cover: ${meta.width}×${meta.height}, wymagane 1920×1080`);
    }
  }
  for (const m of items) if (m.related_id && !ids.has(m.related_id)) errors.push(`materiał ${m.id}: related_id wskazuje nieistniejący materiał`);
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
  const fmt = FORMATS[m.format || 'full'];
  const srcset = COVER_WIDTHS.map((w) => `${m._cover[w]} ${w}w`).join(', ');
  const newTab = '<span class="visually-hidden"> (otwiera się w nowej karcie)</span>';
  const actions = Object.keys(PLATFORM).filter((k) => m[k]).map((k) =>
    link(m, k, `watch-link watch-link--${k === 'youtube' ? 'yt' : 'tt'}`,
      `${PLATFORM[k].cta}<span class="visually-hidden">: ${esc(m.title)}</span>${newTab}<span aria-hidden="true">↗</span>`)).join('');
  const main = link(m, m.primary, 'card__main',
    `<span class="card__cover"><img src="${m._cover[960]}" srcset="${srcset}" sizes="(max-width: 640px) calc(100vw - 32px), (max-width: 1000px) calc(50vw - 30px), 400px" alt="${esc(m.cover_alt || '')}" width="1920" height="1080" loading="lazy" decoding="async">` +
    `<span class="card__badge">${p.label} ↗</span>${fmt ? `<span class="card__format">${fmt}</span>` : ''}</span>` +
    `<h3 class="card__title">${esc(m.title)}<span class="visually-hidden"> – ${p.label}${fmt ? `, ${fmt.toLowerCase()}` : ''}</span>${newTab}</h3>`);
  return `<li><article class="card">${main}` +
    `<p class="card__meta"><span class="card__cat">${CATEGORIES[m.category]}</span><span aria-hidden="true">·</span><time datetime="${m.date}">${dateFmt.format(new Date(`${m.date}T12:00:00Z`))}</time></p>` +
    `<p class="card__lead">${esc(m.lead)}</p><div class="card__actions">${actions}</div></article></li>`;
}

export function renderSection(items) {
  if (!items.length) return { hint: '', section: '' };
  return {
    hint: '<a class="scroll-hint" href="#materialy">Najnowsze materiały <span aria-hidden="true">↓</span></a>',
    section: `<section class="materials" id="materialy" aria-labelledby="materialy-title"><div class="materials__inner">` +
      `<header class="materials__head"><h2 class="materials__title" id="materialy-title">Najnowsze materiały</h2>` +
      `<p class="materials__sub">Oglądaj na YouTube lub TikToku</p></header>` +
      `<ul class="materials__grid">${items.map(card).join('')}</ul></div></section>`,
  };
}
