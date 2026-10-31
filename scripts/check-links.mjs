// Tygodniowa kontrola linków materiałów: czy filmy na YouTube/TikToku nadal istnieją i czy źródła się otwierają.
// Uruchamia .github/workflows/check-links.yml; przy problemach workflow zakłada zgłoszenie (issue) – GitHub wysyła maila.
// Lokalnie: node scripts/check-links.mjs [--json raport.json]
import { readFileSync, writeFileSync } from 'node:fs';

const items = JSON.parse(readFileSync(new URL('../content/materialy.json', import.meta.url), 'utf8')).filter((m) => m.status === 'published');
// Przeglądarkowy User-Agent: część serwisów (TikTok, strony rządowe) inaczej odpowiada nieznanym robotom
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36 KontekstownikLinkCheck/1.0';

async function get(url, { method = 'GET', tries = 2 } = {}) {
  for (let i = 0; i < tries; i++) {
    try {
      const r = await fetch(url, { method, redirect: 'follow', headers: { 'User-Agent': UA, 'Accept-Language': 'pl,en;q=0.8' }, signal: AbortSignal.timeout(20000) });
      return r;
    } catch (e) {
      if (i === tries - 1) return { ok: false, status: 0, error: e.message };
      await new Promise((r) => setTimeout(r, 3000));
    }
  }
}

// Film YouTube: oEmbed zwraca 200 tylko dla istniejącego, publicznego filmu.
async function checkYouTube(url) {
  const r = await get(`https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(url)}`);
  return r.ok ? null : `YouTube oEmbed ${r.status || r.error}`;
}
// Film TikTok: oEmbed odpowiada „sukcesem” nawet dla nieistniejących numerów, więc czytamy stronę filmu:
// istniejący ma "statusCode":0 i "itemStruct", usunięty/prywatny – np. 10204 „item doesn't exist”.
async function checkTikTok(url) {
  const r = await get(url);
  if (!r.ok) return `strona filmu ${r.status || r.error}`;
  const html = await r.text();
  const code = html.match(/"statusCode":(\d+)/)?.[1];
  if (code === '0' && html.includes('"itemStruct"')) return null;
  const msg = html.match(/"statusMsg":"([^"]*)"/)?.[1];
  return code ? `TikTok statusCode ${code}${msg ? ` (${msg})` : ''}` : { warn: 'nie udało się odczytać stanu filmu (TikTok mógł zmienić stronę albo zablokować automat – sprawdź ręcznie)' };
}
// Źródło: 2xx/3xx = OK; 401/403/429 traktujemy jako „blokuje roboty” (ostrzeżenie, nie błąd).
async function checkSource(url) {
  let r = await get(url, { method: 'HEAD' });
  if (!r.ok && [403, 405, 501].includes(r.status)) r = await get(url);
  if (r.ok) return null;
  if ([401, 403, 429].includes(r.status)) return { warn: `odpowiedź ${r.status} (serwer może blokować automatyczne sprawdzanie)` };
  return `odpowiedź ${r.status || r.error}`;
}

const problems = [];
const warnings = [];
for (const m of items) {
  const where = `${m.id} („${m.title}”)`;
  if (m.youtube) { const e = await checkYouTube(m.youtube); if (e) problems.push(`${where}: film YouTube niedostępny – ${e} – ${m.youtube}`); }
  if (m.tiktok) {
    const e = await checkTikTok(m.tiktok);
    if (e?.warn) warnings.push(`${where}: film TikTok – ${e.warn} – ${m.tiktok}`);
    else if (e) problems.push(`${where}: film TikTok niedostępny – ${e} – ${m.tiktok}`);
  }
  const urls = [...(m.sources || []).map((s) => [s.title, s.url]), ...(m.timeline || []).filter((t) => t.source).map((t) => [`oś czasu ${t.date}`, t.source])];
  for (const [title, url] of urls) {
    const e = await checkSource(url);
    if (e?.warn) warnings.push(`${where}: źródło „${title}” – ${e.warn} – ${url}`);
    else if (e) problems.push(`${where}: źródło „${title}” – ${e} – ${url}`);
  }
}

const report = { checked: items.length, problems, warnings, date: new Date().toISOString() };
const out = process.argv.indexOf('--json');
if (out > -1) writeFileSync(process.argv[out + 1], JSON.stringify(report, null, 2));
console.log(`Sprawdzono materiałów: ${items.length}. Problemy: ${problems.length}. Ostrzeżenia: ${warnings.length}.`);
for (const p of problems) console.log(`BŁĄD  ${p}`);
for (const w of warnings) console.log(`UWAGA ${w}`);
process.exit(problems.length ? 1 : 0);
