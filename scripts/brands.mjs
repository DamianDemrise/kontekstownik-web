// Static brand landings share the existing home shell. No client-side router or platform embeds.
import {readFileSync, mkdirSync, writeFileSync} from 'node:fs';
import {resolve} from 'node:path';

const origin = 'https://www.kontekstownik.pl';
export const brands = {
  main: {label: 'Kontekstownik', path: '/'},
  kids: {
    label: 'Kids', path: '/kids/', name: 'KONTEKSTOWNIK KIDS',
    description: 'Krótkie, spokojne wyjaśnienia do wspólnego oglądania. Odkrywamy przyrodę, ciało i codzienne zjawiska.',
    headline: 'Odkrywamy, jak działa świat.', logo: '/brands/kids.png',
    topics: ['Przyroda', 'Ciało', 'Codzienność', 'Internet'],
    channels: {youtube: 'https://www.youtube.com/@kontekstownikkids', instagram: 'https://www.instagram.com/kontekstownikkids/', facebook: 'https://www.facebook.com/profile.php?id=61596068221675'},
  },
  influ: {
    label: 'Influ', path: '/influ/', name: 'KONTEKSTOWNIK INFLU',
    description: 'Wypowiedzi, reakcje i wydarzenia ze świata influencerów. Oryginalne fragmenty, źródła i kontekst.',
    headline: 'Influencerzy. Wypowiedzi. Kontekst.', logo: '/brands/influ.svg',
    topics: ['Influencerzy', 'Wypowiedzi', 'Reakcje', 'Kulisy'],
    channels: {youtube: 'https://www.youtube.com/@kontekstownikinflu', tiktok: 'https://www.tiktok.com/@kontekstownikinflu', instagram: 'https://www.instagram.com/kontekstownikinflu/', facebook: 'https://www.facebook.com/profile.php?id=61595878572945'},
  },
};
const esc = (s) => s.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;');

export function brandNavigation(active = 'main', lang = 'pl') {
  const en = lang === 'en';
  return `<header class="channel-header"><a class="channel-header__home" href="/" aria-label="${en ? 'Kontekstownik — home' : 'Kontekstownik — strona główna'}"><img src="/brand/main/sygnet-kafel.svg" alt="" width="40" height="40"></a>
    <nav class="channel-switch" aria-label="${en ? 'Choose a channel' : 'Wybierz kanał'}">${Object.entries(brands).map(([id,b]) => `<a href="${b.path}" data-channel="${id}"${en && id !== 'main' ? ' hreflang="pl" lang="pl"' : ''}${id === active ? ' aria-current="page"' : ''}>${b.label}</a>`).join('')}</nav>
    <span class="channel-header__caption">${en ? 'Three channels. Different perspectives.' : 'Trzy kanały. Różne perspektywy.'}</span></header>`;
}

function channelButtons(b) {
  return Object.entries(b.channels).map(([platform,url]) => {
    const label = {youtube: 'YouTube', tiktok: 'TikTok', instagram: 'Instagram', facebook: 'Facebook'}[platform];
    return `<a class="brand-channel brand-channel--${platform}" href="${url}" target="_blank" rel="noopener noreferrer" data-platform="${platform}" aria-label="${label}: ${b.name} (otwiera się w nowej karcie)"><span>${label}</span><span aria-hidden="true">↗</span></a>`;
  }).join('');
}

// Published Instagram URLs and approved covers from PUBLIKACJE_SERIA_03.json (1 Nov 2026).
export const kidsItems = [
  ['01','Skąd się wziął Minecraft?','DfNhbSTKhlu'],
  ['02','Dlaczego bajki tak nas wciągają?','DfNhpEBqtMV'],
  ['03','Czy z bajek można nauczyć się angielskiego?','DfNh0UPK9AN'],
  ['04','Dlaczego oglądamy, jak ktoś gra?','DfNiE5Aqsit'],
];
export const influItems = [
  {title: '30 zł za zapiekankę przy cmentarzu?! Książulo sprawdza', date: '2026-11-02', cover: '/brands/ksiazulo.jpg', url: 'https://www.youtube.com/shorts/IFt3bjsn2zY', platform: 'YouTube'},
  {title: 'Andziaks przeprasza. Za te słowa o podatkach.', date: '2026-11-02', cover: '/brands/andziaks.jpg', url: 'https://www.youtube.com/shorts/rtMQjyIiy5M', platform: 'YouTube'},
];
export const kidsLatest = [
  {title: 'Ogień w kosmosie. Dlaczego płomień znika z oczu?', date: '2026-11-02', cover: '/brands/kids-ogien.jpg', url: 'https://www.youtube.com/shorts/oWCOHDkBokw', platform: 'YouTube'},
  ...kidsItems.map(([id, title, reel]) => ({title, date: '2026-11-01', cover: `/brands/kids-${id}.jpg`, url: `https://www.instagram.com/kontekstownikkids/reel/${reel}/`, platform: 'Instagram'})),
];
function latestInflu() {
  const latest = influItems[0];
  return `<section class="brand-latest" aria-labelledby="brand-latest-title"><div class="brand-latest__heading"><p class="brand-eyebrow">Najnowsze materiały</p><h2 id="brand-latest-title">Najpierw wypowiedź. Potem kontekst.</h2></div>
    <article class="brand-feature"><a class="brand-feature__image" href="${latest.url}" target="_blank" rel="noopener noreferrer" aria-label="${esc(latest.title)} — obejrzyj na YouTube (nowa karta)"><img src="${latest.cover}" alt="" width="1080" height="1920" loading="lazy"></a>
    <div class="brand-feature__text"><p class="brand-eyebrow">Wypowiedzi · 2 listopada 2026</p><h3>${latest.title}</h3><p>30 zł za zapiekankę. Zestawiamy ocenę ceny z pozytywną częścią recenzji — z oryginalnym dźwiękiem i naszym komentarzem.</p><div class="brand-feature__links"><a href="${latest.url}" target="_blank" rel="noopener noreferrer">YouTube ↗</a><a href="https://www.instagram.com/reel/DfPfkW4tZgO/" target="_blank" rel="noopener noreferrer">Instagram ↗</a><a href="https://www.tiktok.com/@kontekstownikinflu/video/7703576250744425750" target="_blank" rel="noopener noreferrer">TikTok ↗</a></div></div></article>
    <article class="brand-feature"><a class="brand-feature__image" href="https://www.youtube.com/shorts/rtMQjyIiy5M" target="_blank" rel="noopener noreferrer" aria-label="Andziaks przeprasza — obejrzyj na YouTube (nowa karta)"><img src="/brands/andziaks.jpg" alt="Andziaks podczas oświadczenia. Nagłówek: Andziaks przeprasza." width="1080" height="1920" loading="lazy"></a>
    <div class="brand-feature__text"><p class="brand-eyebrow">Wypowiedzi · 2 listopada 2026</p><h3>Andziaks przeprasza. Za te słowa o podatkach.</h3><p>Co powiedziała w Q&amp;A i jak wyjaśniła to w późniejszym oświadczeniu? Pokazujemy obie wypowiedzi, razem z ich kontekstem.</p><div class="brand-feature__links"><a href="https://www.youtube.com/shorts/rtMQjyIiy5M" target="_blank" rel="noopener noreferrer">YouTube ↗</a><a href="https://www.instagram.com/reel/DfPX0XItP7Z/" target="_blank" rel="noopener noreferrer">Instagram ↗</a><a href="https://www.tiktok.com/@kontekstownikinflu/video/7703563013369957654" target="_blank" rel="noopener noreferrer">TikTok ↗</a></div></div></article></section>`;
}

function latestKids() {
  // Published Instagram URLs and approved covers from PUBLIKACJE_SERIA_03.json (1 Nov 2026).
  const items = kidsItems;
  const latest = kidsLatest[0];
  return `<section class="brand-latest" aria-labelledby="kids-latest-title"><div class="brand-latest__heading"><p class="brand-eyebrow">Najnowsze materiały</p><h2 id="kids-latest-title">Pytania z codziennego świata.</h2></div><div class="brand-kids-grid"><article><a href="${latest.url}" target="_blank" rel="noopener noreferrer" aria-label="${latest.title} — obejrzyj na YouTube (nowa karta)"><img src="${latest.cover}" alt="" width="1080" height="1920" loading="lazy"><div><p class="brand-eyebrow">2 listopada 2026</p><h3>${latest.title}</h3><span>YouTube ↗</span></div></a></article>${items.map(([id,title,reel])=>`<article><a href="https://www.instagram.com/kontekstownikkids/reel/${reel}/" target="_blank" rel="noopener noreferrer" aria-label="${title} — obejrzyj na Instagramie (nowa karta)"><img src="/brands/kids-${id}.jpg" alt="" width="1080" height="1920" loading="lazy"><div><p class="brand-eyebrow">1 listopada 2026</p><h3>${title}</h3><span>Instagram ↗</span></div></a></article>`).join('')}</div></section>`;
}

export function renderBrandPage(template, id) {
  const b = brands[id];
  const title = `${b.name} | ${b.headline}`;
  let head = template.slice(0, template.indexOf('<body>'));
  head = head.replace(/<title>.*?<\/title>/, `<title>${esc(title)}</title>`)
    .replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${esc(b.description)}">`)
    .replace(/<link rel="icon" href="\/favicon.svg"[^>]*>/, `<link rel="icon" href="/brand/${id}/favicon.svg" type="image/svg+xml">`)
    .replace(/<link rel="icon" href="\/favicon-32.png"[^>]*>/, `<link rel="icon" href="/brand/${id}/favicon-32.png" sizes="32x32" type="image/png">`)
    .replace(/<link rel="apple-touch-icon"[^>]*>/, `<link rel="apple-touch-icon" href="/brand/${id}/apple-touch-icon-180.png">`)
    .replace(/<link rel="canonical"[^>]+>/, `<link rel="canonical" href="${origin}${b.path}">`)
    .replace(/\s*<link rel="alternate"[^>]+>/g, '')
    .replace(/<meta property="og:(title|description|site_name|url|image|image:secure_url|image:alt)"[^>]+>/g, '')
    .replace(/<meta name="twitter:(title|description|image|image:alt)"[^>]+>/g, '')
    .replace(/<meta property="og:image:(type|width|height)"[^>]+>/g, '')
    .replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/, `<script type="application/ld+json">${JSON.stringify({'@context':'https://schema.org','@type':'WebSite',name:b.name,url:origin+b.path,inLanguage:'pl-PL'})}</script>`)
    .replace('</head>', `<meta property="og:image" content="${origin}/brand/${id}/og-1200x630.png"><meta property="og:image:type" content="image/png"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta name="twitter:image" content="${origin}/brand/${id}/og-1200x630.png"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(b.description)}"><meta property="og:url" content="${origin}${b.path}"><meta property="og:site_name" content="${b.name}"></head>`);
  const footer = template.slice(template.indexOf('  <footer class="legal">'));
  return `${head}<body data-brand="${id}">${brandNavigation(id)}<main class="brand-page">
    <div class="brand-backdrop" aria-hidden="true"><span></span><span></span><span></span></div>
    <section class="brand-landing" aria-labelledby="brand-heading"><div class="brand-landing__art"><img src="/brand/${id}/awatar-kwadrat.svg" alt="" width="340" height="340"></div>
    <div class="brand-landing__copy"><p class="brand-eyebrow">${id==='kids'?'Do wspólnego oglądania':'Świat twórców internetu'}</p><h1 id="brand-heading">${b.name.replace('KONTEKSTOWNIK ', '<span>Kontekstownik</span> ')}</h1><p class="brand-landing__headline">${b.headline}</p><p class="brand-landing__description">${b.description}</p>
    <ul class="brand-topics" aria-label="Tematy kanału">${b.topics.map(t=>`<li>${t}</li>`).join('')}</ul><div class="brand-channels" aria-label="Oglądaj nas na platformach">${channelButtons(b)}</div></div></section>
    ${id==='influ'?latestInflu():latestKids()}
    </main>${footer.replace('class="legal"', 'class="legal legal--static"')}`;
}

export function prepareBrands(root) {
  const template = readFileSync(resolve(root, 'index.html'), 'utf8');
  const inputs = {};
  for (const id of ['kids','influ']) {
    const dir = resolve(root, id);
    mkdirSync(dir, {recursive:true});
    writeFileSync(resolve(dir,'index.html'), renderBrandPage(template,id));
    inputs[`brand-${id}`] = resolve(dir,'index.html');
  }
  return inputs;
}

export function brandsPlugin() {
  return {
    name:'kontekstownik-brands',
    transformIndexHtml(html,ctx) {
      if (!ctx.filename.endsWith('/index.html') || html.includes('class="channel-header"')) return html;
      if (html.includes('class="hero"')) return html.replace('<body>', `<body class="has-channel-header">${brandNavigation('main', /<html\s+lang="en"/.test(html) ? 'en' : 'pl')}`);
      return html;
    },
  };
}

export function brandSitemapEntries() {
  return ['kids','influ'].map(id=>`<url><loc>${origin}${brands[id].path}</loc></url>`).join('');
}
