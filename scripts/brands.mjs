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
    channels: {youtube: 'https://www.youtube.com/@kontekstownikinflu', tiktok: 'https://www.tiktok.com/@kontekstownikinflu', instagram: 'https://www.instagram.com/kontekstownikinflu/'},
  },
};
const esc = (s) => s.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;');

export function brandNavigation(active = 'main', lang = 'pl') {
  const en = lang === 'en';
  return `<header class="channel-header"><a class="channel-header__home" href="/" aria-label="${en ? 'Kontekstownik — home' : 'Kontekstownik — strona główna'}">K<span aria-hidden="true">.</span></a>
    <nav class="channel-switch" aria-label="${en ? 'Choose a channel' : 'Wybierz kanał'}">${Object.entries(brands).map(([id,b]) => `<a href="${b.path}" data-channel="${id}"${id === active ? ' aria-current="page"' : ''}>${b.label}</a>`).join('')}</nav>
    <span class="channel-header__caption">${en ? 'Three channels. Different perspectives.' : 'Trzy kanały. Różne perspektywy.'}</span></header>`;
}

function channelButtons(b) {
  return Object.entries(b.channels).map(([platform,url]) => {
    const label = {youtube: 'YouTube', tiktok: 'TikTok', instagram: 'Instagram', facebook: 'Facebook'}[platform];
    return `<a class="brand-channel brand-channel--${platform}" href="${url}" target="_blank" rel="noopener noreferrer" data-platform="${platform}" aria-label="${label}: ${b.name} (otwiera się w nowej karcie)"><span>${label}</span><span aria-hidden="true">↗</span></a>`;
  }).join('');
}

function latestInflu() {
  return `<section class="brand-latest" aria-labelledby="brand-latest-title"><div class="brand-latest__heading"><p class="brand-eyebrow">Najnowszy materiał</p><h2 id="brand-latest-title">Najpierw wypowiedź. Potem kontekst.</h2></div>
    <article class="brand-feature"><a class="brand-feature__image" href="https://www.youtube.com/shorts/rtMQjyIiy5M" target="_blank" rel="noopener noreferrer" aria-label="Andziaks przeprasza — obejrzyj na YouTube (nowa karta)"><img src="/brands/andziaks.jpg" alt="Andziaks podczas oświadczenia. Nagłówek: Andziaks przeprasza." width="1080" height="1920" loading="lazy"></a>
    <div class="brand-feature__text"><p class="brand-eyebrow">Wypowiedzi · 2 listopada 2026</p><h3>Andziaks przeprasza. Za te słowa o podatkach.</h3><p>Co powiedziała w Q&amp;A i jak wyjaśniła to w późniejszym oświadczeniu? Pokazujemy obie wypowiedzi, razem z ich kontekstem.</p><div class="brand-feature__links"><a href="https://www.youtube.com/shorts/rtMQjyIiy5M" target="_blank" rel="noopener noreferrer">YouTube ↗</a><a href="https://www.instagram.com/reel/DfPX0XItP7Z/" target="_blank" rel="noopener noreferrer">Instagram ↗</a><a href="https://www.tiktok.com/@kontekstownikinflu/video/7703563013369957654" target="_blank" rel="noopener noreferrer">TikTok ↗</a></div></div></article></section>`;
}

function latestKids() {
  // Published Instagram URLs and approved covers from PUBLIKACJE_SERIA_03.json (1 Nov 2026).
  const items = [
    ['01','Skąd się wziął Minecraft?','DfNhbSTKhlu'],
    ['02','Dlaczego bajki tak nas wciągają?','DfNhpEBqtMV'],
    ['03','Czy z bajek można nauczyć się angielskiego?','DfNh0UPK9AN'],
    ['04','Dlaczego oglądamy, jak ktoś gra?','DfNiE5Aqsit'],
  ];
  return `<section class="brand-latest" aria-labelledby="kids-latest-title"><div class="brand-latest__heading"><p class="brand-eyebrow">Gry, bajki i internet</p><h2 id="kids-latest-title">Pytania z codziennego świata.</h2></div><div class="brand-kids-grid">${items.map(([id,title,reel])=>`<article><a href="https://www.instagram.com/kontekstownikkids/reel/${reel}/" target="_blank" rel="noopener noreferrer" aria-label="${title} — obejrzyj na Instagramie (nowa karta)"><img src="/brands/kids-${id}.jpg" alt="" width="1080" height="1920" loading="lazy"><div><p class="brand-eyebrow">1 listopada 2026</p><h3>${title}</h3><span>Instagram ↗</span></div></a></article>`).join('')}</div></section>`;
}

export function renderBrandPage(template, id) {
  const b = brands[id];
  const title = `${b.name} | ${b.headline}`;
  let head = template.slice(0, template.indexOf('<body>'));
  head = head.replace(/<title>.*?<\/title>/, `<title>${esc(title)}</title>`)
    .replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${esc(b.description)}">`)
    .replace(/<link rel="canonical"[^>]+>/, `<link rel="canonical" href="${origin}${b.path}">`)
    .replace(/\s*<link rel="alternate"[^>]+>/g, '')
    .replace(/<meta property="og:(title|description|site_name|url|image|image:secure_url|image:alt)"[^>]+>/g, '')
    .replace(/<meta name="twitter:(title|description|image|image:alt)"[^>]+>/g, '')
    .replace(/<meta property="og:image:(type|width|height)"[^>]+>/g, '')
    .replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/, `<script type="application/ld+json">${JSON.stringify({'@context':'https://schema.org','@type':'WebSite',name:b.name,url:origin+b.path,inLanguage:'pl-PL'})}</script>`)
    .replace('</head>', `<meta property="og:image" content="${origin}/brands/${id === 'kids' ? 'kids.png' : 'influ-avatar.png'}"><meta name="twitter:image" content="${origin}/brands/${id === 'kids' ? 'kids.png' : 'influ-avatar.png'}"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(b.description)}"><meta property="og:url" content="${origin}${b.path}"><meta property="og:site_name" content="${b.name}"></head>`);
  const footer = template.slice(template.indexOf('  <footer class="legal">'));
  return `${head}<body data-brand="${id}">${brandNavigation(id)}<main class="brand-page">
    <div class="brand-backdrop" aria-hidden="true"><span></span><span></span><span></span></div>
    <section class="brand-landing" aria-labelledby="brand-heading"><div class="brand-landing__art"><img src="${b.logo}" alt="" ${id==='kids'?'width="1254" height="1254"':'width="2400" height="375"'}></div>
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
