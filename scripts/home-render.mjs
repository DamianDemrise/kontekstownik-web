// Strona główna jako centrum trzech kanałów: kafelki marek w hero i pasy „Najnowsze”. Statyczny HTML, bez JS i odtwarzaczy.
import {brands, kidsItems, influItems} from './brands.mjs';
import {card, forLang, FEATURED} from './materials-render.mjs';

// Jedno miejsce na grafiki marek: podmiana pliku /brand/<marka>/sygnet-kafel.svg (kwadrat; źródło: repo kontekstownik-brand, dist/<marka>/logo) zmienia kafelki bez zmian w kodzie.
const brandLogo = (id) => `/brand/${id}/sygnet-kafel.svg`;
const PLATFORM = {youtube: 'YouTube', tiktok: 'TikTok', instagram: 'Instagram', facebook: 'Facebook', email: 'E-mail'};
const main = {
  logo: brandLogo('main'), name: 'Kontekstownik', sentence: 'Polityka, gospodarka i świat. Wyjaśniamy, co naprawdę się dzieje.',
  channels: {
    youtube: 'https://www.youtube.com/@kontekstowniktv', tiktok: 'https://www.tiktok.com/@kontekstownik',
    instagram: 'https://www.instagram.com/kontekstownik/', facebook: 'https://www.facebook.com/profile.php?id=61595806302950', email: 'mailto:kontekstownik@gmail.com',
  },
};
const tiles = [
  {id: 'main', href: '#najnowsze-main', go: 'Najnowsze materiały', ...main},
  {id: 'kids', href: brands.kids.path, go: 'Wejdź do Kids', logo: brandLogo('kids'), name: 'Kontekstownik Kids',
    sentence: 'Odkrywamy, jak działa świat. Krótkie wyjaśnienia do wspólnego oglądania.', channels: brands.kids.channels},
  {id: 'influ', href: brands.influ.path, go: 'Wejdź do Influ', logo: brandLogo('influ'), name: 'Kontekstownik Influ',
    sentence: 'Wypowiedzi znanych twarzy. Najpierw wypowiedź, potem kontekst.', channels: brands.influ.channels},
];

export function renderHomeHero() {
  return `<ul class="brand-tiles" aria-label="Trzy kanały Kontekstownika">${tiles.map((t) => `
    <li class="brand-tile brand-tile--${t.id}" data-brand="${t.id}"><a class="brand-tile__main" href="${t.href}">
      <img class="brand-tile__logo" src="${t.logo}" alt="" width="72" height="72" decoding="async">
      <span class="brand-tile__name">${t.name}</span><span class="brand-tile__text">${t.sentence}</span>
      <span class="brand-tile__go">${t.go} <span aria-hidden="true">${t.id === 'main' ? '↓' : '→'}</span></span></a>
      <p class="brand-tile__accounts"><span class="visually-hidden">Konta ${t.name}: </span>${Object.entries(t.channels).map(([k, u]) =>
        `<a href="${u}"${k === 'email' ? '' : ' target="_blank" rel="noopener noreferrer"'} ${['youtube', 'tiktok'].includes(k) ? 'data-platform' : 'data-social'}="${k}" aria-label="${k === 'email' ? 'Napisz do nas: kontekstownik@gmail.com' : `${PLATFORM[k]}: ${t.name} (otwiera się w nowej karcie)`}">${PLATFORM[k]}</a>`).join('')}</p></li>`).join('')}</ul>`;
}

const fmtDate = (d) => new Intl.DateTimeFormat('pl-PL', {day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC'}).format(new Date(d + 'T12:00:00Z'));
const band = (id, title, more, body) => `<section class="band band--${id}" data-brand="${id}" id="najnowsze-${id}" aria-labelledby="band-${id}-title"><header class="band__head"><h2 class="band__title" id="band-${id}-title">${title}</h2>${more}</header>${body}</section>`;
const verticalCard = ({title, date, cover, url, platform}) => `<li><article class="vcard"><a href="${url}" target="_blank" rel="noopener noreferrer" aria-label="${title} (otwiera się w nowej karcie)"><img src="${cover}" alt="" width="1080" height="1920" loading="lazy" decoding="async"><span class="vcard__body"><time datetime="${date}">${fmtDate(date)}</time><h3>${title}</h3><span class="vcard__go">${platform} <span aria-hidden="true">↗</span></span></span></a></article></li>`;

export function renderHomeBands(all) {
  const items = forLang(all, 'pl').slice(0, FEATURED);
  const kids = kidsItems.map(([id, title, reel]) => ({title, date: '2026-11-01', cover: `/brands/kids-${id}.jpg`, url: `https://www.instagram.com/kontekstownikkids/reel/${reel}/`, platform: 'Instagram'}));
  const soon = (what) => `<p class="band__soon">${what} wkrótce.</p>`;
  return `<div class="bands" id="najnowsze">` +
    band('main', 'Najnowsze: Kontekstownik', '<a class="band__more" href="#materialy">Wszystkie materiały <span aria-hidden="true">↓</span></a>',
      items.length ? `<ul class="materials__grid">${items.map((m) => card(m, 'pl')).join('')}</ul>` : soon('Pierwsze materiały')) +
    band('kids', 'Najnowsze: Kids', '<a class="band__more" href="/kids/">Wszystkie w Kids <span aria-hidden="true">→</span></a>',
      `<ul class="vgrid">${kids.map(verticalCard).join('')}</ul>`) +
    band('influ', 'Najnowsze: Influ', '<a class="band__more" href="/influ/">Wszystkie w Influ <span aria-hidden="true">→</span></a>',
      `<ul class="vgrid">${influItems.map(verticalCard).join('')}</ul>${soon('Kolejne materiały')}`) +
    `</div>`;
}
