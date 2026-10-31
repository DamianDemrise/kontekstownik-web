// HTML materiałów: karty i pasek na stronie głównej, podstrona każdego materiału, sitemap.
// Wejście: lista z loadMaterials() po renderCovers() (pole _cover). Wszystkie teksty z danych przechodzą przez esc().
import { CATEGORIES, COVER_WIDTHS, PLATFORM } from './materials.mjs';

export const SITE = 'https://www.kontekstownik.pl';
export const pagePath = (m) => `/materialy/${m.slug}/`;

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const dateFmt = new Intl.DateTimeFormat('pl-PL', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
const fmtDate = (d) => dateFmt.format(new Date(`${d}T12:00:00Z`));
const fmtDuration = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
const formatLabel = (m) => (m.format === 'short' ? 'Skrót' : m.related_id ? 'Pełny materiał' : null);
const platforms = (m) => Object.keys(PLATFORM).filter((k) => m[k]);
const newTab = '<span class="visually-hidden"> (otwiera się w nowej karcie)</span>';

function platformLink(m, platform, cls, inner, placement) {
  return `<a class="${cls}" href="${esc(m[platform])}" target="_blank" rel="noopener noreferrer" data-platform="${platform}" ` +
    `data-material="${esc(m.id)}" data-category="${esc(m.category)}"${placement ? ` data-placement="${placement}"` : ''}>${inner}</a>`;
}

function coverImg(m, sizes, eager = false) {
  const srcset = COVER_WIDTHS.map((w) => `${m._cover[w]} ${w}w`).join(', ');
  return `<img src="${m._cover[960]}" srcset="${srcset}" sizes="${sizes}" alt="${esc(m.cover_alt || '')}" width="1920" height="1080" ` +
    (eager ? 'fetchpriority="high" decoding="async"' : 'loading="lazy" decoding="async"') + '>';
}

// Karta: okładka i tytuł prowadzą do podstrony materiału; przyciski – prosto na platformy.
function card(m) {
  const fmt = formatLabel(m);
  const actions = platforms(m).map((k) => platformLink(m, k, `watch-link watch-link--${k === 'youtube' ? 'yt' : 'tt'}`,
    `${PLATFORM[k].cta}<span class="visually-hidden">: ${esc(m.title)}</span>${newTab}<span aria-hidden="true">↗</span>`)).join('');
  return `<li><article class="card"><a class="card__main" href="${pagePath(m)}">` +
    `<span class="card__cover">${coverImg(m, '(max-width: 640px) calc(100vw - 32px), (max-width: 1000px) calc(50vw - 30px), (max-width: 1272px) calc(33vw - 30px), 395px')}` +
    `${fmt ? `<span class="card__format" aria-hidden="true">${fmt}</span>` : ''}</span>` +
    `<h3 class="card__title">${esc(m.title)}</h3></a>` +
    `<p class="card__meta"><span class="card__cat">${CATEGORIES[m.category]}</span><span aria-hidden="true">·</span><time datetime="${m.date}">${fmtDate(m.date)}</time></p>` +
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

function jsonLd(m) {
  const url = SITE + pagePath(m);
  const data = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Article',
        '@id': `${url}#artykul`,
        headline: m.title,
        description: m.lead,
        datePublished: m.date,
        dateModified: m.as_of || m.date,
        inLanguage: 'pl-PL',
        image: SITE + m._cover.og,
        mainEntityOfPage: url,
        articleSection: CATEGORIES[m.category],
        author: { '@id': `${SITE}/#organization` },
        publisher: { '@type': 'Organization', '@id': `${SITE}/#organization`, name: 'KONTEKSTOWNIK', url: `${SITE}/`, logo: `${SITE}/icons/icon-512.png` },
        ...(m.sources?.length ? { citation: m.sources.map((s) => ({ '@type': 'CreativeWork', name: s.title, url: s.url })) } : {}),
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'KONTEKSTOWNIK', item: `${SITE}/` },
          { '@type': 'ListItem', position: 2, name: 'Materiały', item: `${SITE}/#materialy` },
          { '@type': 'ListItem', position: 3, name: m.title, item: url },
        ],
      },
    ],
  };
  // „</” w JSON nie może zamknąć znacznika <script>
  return JSON.stringify(data, null, 2).replace(/</g, '\\u003c');
}

const CONSENT = `<section class="consent" id="consent" role="region" aria-labelledby="consent-title" hidden>
    <h2 class="consent__title" id="consent-title">Twoja prywatność</h2>
    <p class="consent__text">Za Twoją zgodą używamy Google Analytics, żeby wiedzieć, ile osób odwiedza stronę i które przejście wybiera. Bez zgody nic nie mierzymy. <a href="/polityka-prywatnosci/">Polityka prywatności</a></p>
    <div class="consent__actions">
      <button type="button" class="consent__btn" data-consent="reject">Odrzucam</button>
      <button type="button" class="consent__btn" data-consent="accept">Akceptuję</button>
    </div>
  </section>`;

// Źródłowy HTML podstrony (Vite przetwarza go jak każdą stronę: dokleja CSS/JS z hashami).
export function renderPage(m, all) {
  const url = SITE + pagePath(m);
  const title = `${m.title} | KONTEKSTOWNIK`;
  const fmt = formatLabel(m);
  const host = (u) => new URL(u).hostname.replace(/^www\./, '');
  const big = platforms(m).map((k) => platformLink(m, k, `cta cta--${k === 'youtube' ? 'yt' : 'tt'}`,
    `<span class="cta__label">${PLATFORM[k].cta}</span>${newTab}<svg class="cta__arrow" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h15M13 6l6 6-6 6"/></svg>`, 'podstrona')).join('');
  const more = all.filter((x) => x.id !== m.id).slice(0, 3);
  const meta = [`<span class="card__cat">${CATEGORIES[m.category]}</span>`, `<time datetime="${m.date}">${fmtDate(m.date)}</time>`]
    .concat(m.duration_seconds ? [`<span>${fmtDuration(m.duration_seconds)} min</span>`] : [])
    .concat(fmt ? [`<span>${fmt}</span>`] : []).join('<span aria-hidden="true">·</span>');

  return `<!doctype html>
<html lang="pl">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(m.lead)}">
  <link rel="canonical" href="${url}">
  <meta name="robots" content="index, follow">
  <meta name="theme-color" content="#080D12">
  <meta name="color-scheme" content="dark">
  <meta property="og:type" content="article">
  <meta property="og:locale" content="pl_PL">
  <meta property="og:site_name" content="KONTEKSTOWNIK">
  <meta property="og:url" content="${url}">
  <meta property="og:title" content="${esc(m.title)}">
  <meta property="og:description" content="${esc(m.lead)}">
  <meta property="og:image" content="${SITE}${m._cover.og}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:type" content="image/jpeg">
  <meta property="article:published_time" content="${m.date}">
  <meta property="article:section" content="${CATEGORIES[m.category]}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${esc(m.title)}">
  <meta name="twitter:description" content="${esc(m.lead)}">
  <meta name="twitter:image" content="${SITE}${m._cover.og}">
  <link rel="icon" href="/favicon.svg" type="image/svg+xml">
  <link rel="icon" href="/favicon-32.png" sizes="32x32" type="image/png">
  <link rel="apple-touch-icon" href="/apple-touch-icon.png">
  <link rel="preload" href="/fonts/montserrat-latin-v2.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="preload" href="/fonts/montserrat-latin-ext-v2.woff2" as="font" type="font/woff2" crossorigin>
  <script type="application/ld+json">
${jsonLd(m)}
  </script>
  <script type="module" src="/src/scripts/material.js"></script>
</head>
<body class="doc mp-page">
  <main class="mp">
    <a class="doc__logo" href="/"><span class="doc__corner" aria-hidden="true"></span>KONTEKSTOWNIK</a>
    <nav class="mp-crumbs" aria-label="Okruszki">
      <a href="/">Strona główna</a><span aria-hidden="true">›</span><a href="/#materialy">Materiały</a><span aria-hidden="true">›</span><span aria-current="page">${esc(m.title)}</span>
    </nav>
    <article class="mp-article">
      <p class="mp-meta">${meta}</p>
      <h1 class="mp-title">${esc(m.title)}</h1>
      <p class="mp-lead">${esc(m.lead)}</p>
      <a class="mp-cover" href="${esc(m[m.primary])}" target="_blank" rel="noopener noreferrer" data-platform="${m.primary}" data-material="${esc(m.id)}" data-category="${esc(m.category)}" data-placement="podstrona">
        ${coverImg(m, '(max-width: 820px) calc(100vw - 40px), 780px', true)}
        <span class="mp-cover__badge" aria-hidden="true">Obejrzyj na ${PLATFORM[m.primary].label} ↗</span>
        <span class="visually-hidden">Obejrzyj „${esc(m.title)}” na ${PLATFORM[m.primary].label}</span>${newTab}
      </a>
      <div class="mp-watch">${big}</div>
      ${m.summary?.length ? `<div class="mp-body">${m.summary.map((p) => `<p>${esc(p)}</p>`).join('')}</div>` : ''}
      ${m.as_of ? `<p class="mp-asof">Stan informacji: <time datetime="${m.as_of}">${fmtDate(m.as_of)}</time></p>` : ''}
      ${m.sources?.length ? `<section class="mp-sources" aria-labelledby="zrodla"><h2 id="zrodla">Źródła</h2><ol>${m.sources.map((s) =>
        `<li><a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.title)}${newTab}</a> <span class="mp-host">${esc(host(s.url))}</span></li>`).join('')}</ol></section>` : ''}
      ${m.note ? `<p class="mp-note">${esc(m.note)}</p>` : ''}
      <div class="mp-share">
        <button type="button" class="mp-share__btn" data-share data-share-title="${esc(m.title)}" data-share-url="${url}">Udostępnij</button>
        <span class="mp-share__status" role="status" aria-live="polite"></span>
      </div>
    </article>
    ${more.length ? `<section class="materials mp-more" aria-labelledby="wiecej"><div class="materials__inner"><header class="materials__head"><h2 class="materials__title" id="wiecej">Więcej materiałów</h2></header><ul class="materials__grid">${more.map(card).join('')}</ul></div></section>` : ''}
  </main>

  <footer class="legal legal--static">
    <a href="/polityka-prywatnosci/">Polityka prywatności</a>
    <span aria-hidden="true">·</span>
    <button type="button" data-consent-open>Ustawienia cookies</button>
  </footer>

  ${CONSENT}
</body>
</html>
`;
}

export function renderSitemap(items) {
  const lastHome = items[0]?.date || '2026-10-31';
  const urls = [
    { loc: `${SITE}/`, lastmod: lastHome },
    ...items.map((m) => ({ loc: SITE + pagePath(m), lastmod: m.as_of || m.date })),
    { loc: `${SITE}/polityka-prywatnosci/`, lastmod: '2026-10-31' },
  ];
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    urls.map((u) => `  <url>\n    <loc>${u.loc}</loc>\n    <lastmod>${u.lastmod}</lastmod>\n  </url>`).join('\n') + '\n</urlset>\n';
}
