// HTML materiałów w dwóch językach: karty i pasek na stronie głównej, podstrona każdego materiału, sitemap.
// Wejście: lista z loadMaterials() po renderCovers() (pole _cover). Wszystkie teksty z danych przechodzą przez esc().
// Po angielsku pokazujemy tylko materiały z tłumaczeniem (pole `en`); filmy same są po polsku.
import { CATEGORIES, CATEGORIES_EN, COVER_WIDTHS } from './materials.mjs';

export const SITE = 'https://www.kontekstownik.pl';

const T = {
  pl: {
    locale: 'pl-PL', og: 'pl_PL', home: '/', privacy: '/polityka-prywatnosci/', base: '/materialy/',
    cats: CATEGORIES, cta: { youtube: 'Obejrzyj na YouTube', tiktok: 'Obejrzyj na TikToku' },
    newTab: ' (otwiera się w nowej karcie)', short: 'Skrót', full: 'Pełny materiał',
    latest: 'Najnowsze materiały', latestSub: 'Oglądaj na YouTube lub TikToku', more: 'Więcej materiałów',
    pillLabel: 'Nowy materiał', pillSr: '. Przewiń do najnowszych materiałów', pillClose: 'Ukryj powiadomienie o nowym materiale',
    crumbs: 'Okruszki', crumbHome: 'Strona główna', crumbList: 'Materiały', asOf: 'Stan informacji:', sources: 'Źródła',
    share: 'Udostępnij', shareDone: 'Link skopiowany', shareFallback: 'Skopiuj link:', watchOn: 'Obejrzyj na', inPolish: '',
    privacyLink: 'Polityka prywatności', cookies: 'Ustawienia cookies', min: 'min',
    consentTitle: 'Twoja prywatność',
    consentText: 'Za Twoją zgodą używamy Google Analytics, żeby wiedzieć, ile osób odwiedza stronę i które przejście wybiera. Bez zgody nic nie mierzymy.',
    reject: 'Odrzucam', accept: 'Akceptuję', langNav: 'Język',
  },
  en: {
    locale: 'en', og: 'en_GB', home: '/en/', privacy: '/en/privacy-policy/', base: '/en/materials/',
    cats: CATEGORIES_EN, cta: { youtube: 'Watch on YouTube', tiktok: 'Watch on TikTok' },
    newTab: ' (opens in a new tab)', short: 'Short', full: 'Full video',
    latest: 'Latest videos', latestSub: 'In Polish · watch on YouTube or TikTok', more: 'More videos',
    pillLabel: 'New video', pillSr: '. Scroll to the latest videos', pillClose: 'Hide the new video notice',
    crumbs: 'Breadcrumbs', crumbHome: 'Home', crumbList: 'Videos', asOf: 'Information as of', sources: 'Sources',
    share: 'Share', shareDone: 'Link copied', shareFallback: 'Copy the link:', watchOn: 'Watch on', inPolish: 'The video is in Polish.',
    privacyLink: 'Privacy policy', cookies: 'Cookie settings', min: 'min',
    consentTitle: 'Your privacy',
    consentText: 'With your consent we use Google Analytics to see how many people visit the site and which platform they choose. Without consent we measure nothing.',
    reject: 'Reject', accept: 'Accept', langNav: 'Language',
  },
};
const PLATFORM_LABEL = { youtube: 'YouTube', tiktok: 'TikTok' };

export const pagePath = (m, lang = 'pl') => `${T[lang].base}${lang === 'en' ? m.en?.slug || m.slug : m.slug}/`;
export const forLang = (items, lang) => (lang === 'en' ? items.filter((m) => m.en) : items);

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmtDate = (d, lang) => new Intl.DateTimeFormat(lang === 'en' ? 'en-GB' : 'pl-PL', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
  .format(new Date(`${d}T12:00:00Z`));
const fmtDuration = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
const txt = (m, lang, key) => (lang === 'en' ? m.en?.[key] : m[key]);
const formatLabel = (m, t) => (m.format === 'short' ? t.short : m.related_id ? t.full : null);
const platforms = (m) => Object.keys(PLATFORM_LABEL).filter((k) => m[k]);
const sr = (s) => `<span class="visually-hidden">${s}</span>`;

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
function card(m, lang) {
  const t = T[lang];
  const title = txt(m, lang, 'title');
  const fmt = formatLabel(m, t);
  const actions = platforms(m).map((k) => platformLink(m, k, `watch-link watch-link--${k === 'youtube' ? 'yt' : 'tt'}`,
    `${t.cta[k]}${sr(`: ${esc(title)}`)}${sr(t.newTab)}<span aria-hidden="true">↗</span>`)).join('');
  return `<li><article class="card"><a class="card__main" href="${pagePath(m, lang)}">` +
    `<span class="card__cover">${coverImg(m, '(max-width: 640px) calc(100vw - 32px), (max-width: 1000px) calc(50vw - 30px), (max-width: 1272px) calc(33vw - 30px), 395px')}` +
    `${fmt ? `<span class="card__format" aria-hidden="true">${fmt}</span>` : ''}</span>` +
    `<h3 class="card__title">${esc(title)}</h3></a>` +
    `<p class="card__meta"><span class="card__cat">${t.cats[m.category]}</span><span aria-hidden="true">·</span><time datetime="${m.date}">${fmtDate(m.date, lang)}</time></p>` +
    `<p class="card__lead">${esc(txt(m, lang, 'lead'))}</p><div class="card__actions">${actions}</div></article></li>`;
}

function newPill(m, count, lang) {
  const t = T[lang];
  const more = count > 1 ? ` <span class="new-pill__more">+${count - 1}</span>` : '';
  return `<div class="new-pill" data-new-pill hidden>` +
    `<a class="new-pill__link" href="#materialy" data-new-pill-link>` +
    `<img class="new-pill__thumb" src="${m._cover[480]}" alt="" width="1920" height="1080" decoding="async">` +
    `<span class="new-pill__text"><span class="new-pill__label">${t.pillLabel}${more}</span>` +
    `<span class="new-pill__title">${esc(txt(m, lang, 'title'))}</span></span>` +
    `<span class="new-pill__go" aria-hidden="true">↓</span>${sr(t.pillSr)}</a>` +
    `<button type="button" class="new-pill__close" data-new-pill-close aria-label="${t.pillClose}">×</button></div>`;
}

export function renderSection(all, lang = 'pl') {
  const items = forLang(all, lang);
  if (!items.length) return { hint: '', section: '' };
  const t = T[lang];
  return {
    // Przyklejony pasek o najnowszym materiale (pokazuje go new-pill.js; bez JS zostaje ukryty).
    hint: newPill(items[0], items.length, lang),
    section: `<section class="materials" id="materialy" aria-labelledby="materialy-title"><div class="materials__inner">` +
      `<header class="materials__head"><h2 class="materials__title" id="materialy-title">${t.latest}</h2>` +
      `<p class="materials__sub">${t.latestSub}</p></header>` +
      `<ul class="materials__grid">${items.map((m) => card(m, lang)).join('')}</ul></div></section>`,
  };
}

function jsonLd(m, lang) {
  const t = T[lang];
  const url = SITE + pagePath(m, lang);
  const data = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Article',
        '@id': `${url}#article`,
        headline: txt(m, lang, 'title'),
        description: txt(m, lang, 'lead'),
        datePublished: m.date,
        dateModified: m.as_of || m.date,
        inLanguage: t.locale,
        image: SITE + m._cover.og,
        mainEntityOfPage: url,
        articleSection: t.cats[m.category],
        author: { '@id': `${SITE}/#organization` },
        publisher: { '@type': 'Organization', '@id': `${SITE}/#organization`, name: 'KONTEKSTOWNIK', url: `${SITE}/`, logo: `${SITE}/icons/icon-512.png` },
        ...(m.sources?.length ? { citation: m.sources.map((s) => ({ '@type': 'CreativeWork', name: s.title, url: s.url })) } : {}),
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'KONTEKSTOWNIK', item: SITE + t.home },
          { '@type': 'ListItem', position: 2, name: t.crumbList, item: `${SITE}${t.home}#materialy` },
          { '@type': 'ListItem', position: 3, name: txt(m, lang, 'title'), item: url },
        ],
      },
    ],
  };
  // „</” w JSON nie może zamknąć znacznika <script>
  return JSON.stringify(data, null, 2).replace(/</g, '\\u003c');
}

// Przełącznik języka: link do odpowiednika strony; aria-current przy bieżącym.
export function langSwitch(lang, plHref, enHref) {
  const a = (code, href, label) => code === lang
    ? `<a href="${href}" hreflang="${code}" lang="${code}" aria-current="page">${label}</a>`
    : href ? `<a href="${href}" hreflang="${code}" lang="${code}">${label}</a>` : '';
  return `<nav class="lang" aria-label="${T[lang].langNav}">${a('pl', plHref, 'PL')}${a('en', enHref, 'EN')}</nav>`;
}

const hreflangLinks = (plUrl, enUrl) => [
  `<link rel="alternate" hreflang="pl" href="${plUrl}">`,
  ...(enUrl ? [`<link rel="alternate" hreflang="en" href="${enUrl}">`] : []),
  `<link rel="alternate" hreflang="x-default" href="${plUrl}">`,
].join('\n  ');

function consent(t) {
  return `<section class="consent" id="consent" role="region" aria-labelledby="consent-title" hidden>
    <h2 class="consent__title" id="consent-title">${t.consentTitle}</h2>
    <p class="consent__text">${t.consentText} <a href="${t.privacy}">${t.privacyLink}</a></p>
    <div class="consent__actions">
      <button type="button" class="consent__btn" data-consent="reject">${t.reject}</button>
      <button type="button" class="consent__btn" data-consent="accept">${t.accept}</button>
    </div>
  </section>`;
}

// Źródłowy HTML podstrony (Vite przetwarza go jak każdą stronę: dokleja CSS/JS z hashami).
export function renderPage(m, all, lang = 'pl') {
  const t = T[lang];
  const url = SITE + pagePath(m, lang);
  const plUrl = SITE + pagePath(m, 'pl');
  const enUrl = m.en ? SITE + pagePath(m, 'en') : null;
  const title = txt(m, lang, 'title');
  const lead = txt(m, lang, 'lead');
  const summary = txt(m, lang, 'summary');
  const note = txt(m, lang, 'note');
  const fmt = formatLabel(m, t);
  const host = (u) => new URL(u).hostname.replace(/^www\./, '');
  const big = platforms(m).map((k) => platformLink(m, k, `cta cta--${k === 'youtube' ? 'yt' : 'tt'}`,
    `<span class="cta__label">${t.cta[k]}</span>${sr(t.newTab)}<svg class="cta__arrow" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h15M13 6l6 6-6 6"/></svg>`, 'podstrona')).join('');
  const more = forLang(all, lang).filter((x) => x.id !== m.id).slice(0, 3);
  const meta = [`<span class="card__cat">${t.cats[m.category]}</span>`, `<time datetime="${m.date}">${fmtDate(m.date, lang)}</time>`]
    .concat(m.duration_seconds ? [`<span>${fmtDuration(m.duration_seconds)} ${t.min}</span>`] : [])
    .concat(fmt ? [`<span>${fmt}</span>`] : []).join('<span aria-hidden="true">·</span>');

  return `<!doctype html>
<html lang="${lang}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>${esc(title)} | KONTEKSTOWNIK</title>
  <meta name="description" content="${esc(lead)}">
  <link rel="canonical" href="${url}">
  ${hreflangLinks(plUrl, enUrl)}
  <meta name="robots" content="index, follow">
  <meta name="theme-color" content="#080D12">
  <meta name="color-scheme" content="dark">
  <meta property="og:type" content="article">
  <meta property="og:locale" content="${t.og}">
  <meta property="og:site_name" content="KONTEKSTOWNIK">
  <meta property="og:url" content="${url}">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(lead)}">
  <meta property="og:image" content="${SITE}${m._cover.og}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:type" content="image/jpeg">
  <meta property="article:published_time" content="${m.date}">
  <meta property="article:section" content="${t.cats[m.category]}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${esc(title)}">
  <meta name="twitter:description" content="${esc(lead)}">
  <meta name="twitter:image" content="${SITE}${m._cover.og}">
  <link rel="icon" href="/favicon.svg" type="image/svg+xml">
  <link rel="icon" href="/favicon-32.png" sizes="32x32" type="image/png">
  <link rel="apple-touch-icon" href="/apple-touch-icon.png">
  <link rel="preload" href="/fonts/montserrat-latin-v2.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="preload" href="/fonts/montserrat-latin-ext-v2.woff2" as="font" type="font/woff2" crossorigin>
  <script type="application/ld+json">
${jsonLd(m, lang)}
  </script>
  <script type="module" src="/src/scripts/material.js"></script>
</head>
<body class="doc mp-page">
  ${langSwitch(lang, pagePath(m, 'pl'), m.en ? pagePath(m, 'en') : null)}
  <main class="mp">
    <a class="doc__logo" href="${t.home}"><span class="doc__corner" aria-hidden="true"></span>KONTEKSTOWNIK</a>
    <nav class="mp-crumbs" aria-label="${t.crumbs}">
      <a href="${t.home}">${t.crumbHome}</a><span aria-hidden="true">›</span><a href="${t.home}#materialy">${t.crumbList}</a><span aria-hidden="true">›</span><span aria-current="page">${esc(title)}</span>
    </nav>
    <article class="mp-article">
      <p class="mp-meta">${meta}</p>
      <h1 class="mp-title">${esc(title)}</h1>
      <p class="mp-lead">${esc(lead)}</p>
      <a class="mp-cover" href="${esc(m[m.primary])}" target="_blank" rel="noopener noreferrer" data-platform="${m.primary}" data-material="${esc(m.id)}" data-category="${esc(m.category)}" data-placement="podstrona">
        ${coverImg(m, '(max-width: 820px) calc(100vw - 40px), 780px', true)}
        <span class="mp-cover__badge" aria-hidden="true">${t.watchOn} ${PLATFORM_LABEL[m.primary]} ↗</span>
        ${sr(`${t.watchOn} „${esc(title)}” – ${PLATFORM_LABEL[m.primary]}${t.newTab}`)}
      </a>
      <div class="mp-watch">${big}</div>
      ${t.inPolish ? `<p class="mp-inpolish">${t.inPolish}</p>` : ''}
      ${summary?.length ? `<div class="mp-body">${summary.map((p) => `<p>${esc(p)}</p>`).join('')}</div>` : ''}
      ${m.as_of ? `<p class="mp-asof">${t.asOf} <time datetime="${m.as_of}">${fmtDate(m.as_of, lang)}</time></p>` : ''}
      ${m.sources?.length ? `<section class="mp-sources" aria-labelledby="zrodla"><h2 id="zrodla">${t.sources}</h2><ol>${m.sources.map((s) =>
        `<li><a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer"${lang === 'en' ? ' lang="pl"' : ''}>${esc(s.title)}${sr(t.newTab)}</a> <span class="mp-host">${esc(host(s.url))}</span></li>`).join('')}</ol></section>` : ''}
      ${note ? `<p class="mp-note">${esc(note)}</p>` : ''}
      <div class="mp-share">
        <button type="button" class="mp-share__btn" data-share data-share-title="${esc(title)}" data-share-url="${url}" data-share-done="${t.shareDone}" data-share-fallback="${t.shareFallback}">${t.share}</button>
        <span class="mp-share__status" role="status" aria-live="polite"></span>
      </div>
    </article>
    ${more.length ? `<section class="materials mp-more" aria-labelledby="wiecej"><div class="materials__inner"><header class="materials__head"><h2 class="materials__title" id="wiecej">${t.more}</h2></header><ul class="materials__grid">${more.map((x) => card(x, lang)).join('')}</ul></div></section>` : ''}
  </main>

  <footer class="legal legal--static">
    <a href="${t.privacy}">${t.privacyLink}</a>
    <span aria-hidden="true">·</span>
    <button type="button" data-consent-open>${t.cookies}</button>
  </footer>

  ${consent(t)}
</body>
</html>
`;
}

// Mapa strony z alternatywnymi wersjami językowymi (hreflang w sitemap).
export function renderSitemap(items) {
  const lastHome = items[0]?.date || '2026-10-31';
  const pairs = [
    { pl: '/', en: '/en/', lastmod: lastHome },
    ...items.map((m) => ({ pl: pagePath(m, 'pl'), en: m.en ? pagePath(m, 'en') : null, lastmod: m.as_of || m.date })),
    { pl: '/polityka-prywatnosci/', en: '/en/privacy-policy/', lastmod: '2026-10-31' },
  ];
  const alt = (p) => [`    <xhtml:link rel="alternate" hreflang="pl" href="${SITE}${p.pl}"/>`]
    .concat(p.en ? [`    <xhtml:link rel="alternate" hreflang="en" href="${SITE}${p.en}"/>`] : [])
    .concat([`    <xhtml:link rel="alternate" hreflang="x-default" href="${SITE}${p.pl}"/>`]).join('\n');
  const urls = pairs.flatMap((p) => [p.pl, p.en].filter(Boolean).map((loc) =>
    `  <url>\n    <loc>${SITE}${loc}</loc>\n    <lastmod>${p.lastmod}</lastmod>\n${alt(p)}\n  </url>`));
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n` +
    urls.join('\n') + '\n</urlset>\n';
}
