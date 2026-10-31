// GA4 w trybie podstawowym Consent Mode v2: gtag.js ładuje się dopiero po zgodzie na analitykę.
// Reklamowe sygnały zawsze wyłączone. Kliknięcia w platformy (hero i karty materiałów) -> zdarzenie kluczowe `platform_click`.
import { GA_MEASUREMENT_ID } from './config.js';

let loaded = false;

function gtag() { window.dataLayer.push(arguments); }

export function startAnalytics() {
  if (loaded) return;
  loaded = true;
  window.dataLayer = window.dataLayer || [];
  window.gtag = gtag;
  gtag('consent', 'default', {
    analytics_storage: 'granted',
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
  });
  gtag('js', new Date());
  gtag('config', GA_MEASUREMENT_ID, { allow_google_signals: false, allow_ad_personalization_signals: false });

  const s = document.createElement('script');
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  document.head.appendChild(s);

  document.addEventListener('click', (e) => {
    const link = e.target.closest?.('a[data-platform]');
    if (!link) return;
    // placement: hero (główne przyciski) albo karta materiału; material_id/category tylko przy kartach
    gtag('event', 'platform_click', {
      platform: link.dataset.platform,
      placement: link.closest('.card') ? 'material' : 'hero',
      material_id: link.dataset.material,
      category: link.dataset.category,
      link_url: link.href,
    });
  });
}

// Wycofanie zgody: kasujemy ciasteczka GA i przeładowujemy stronę bez gtag.js.
export function stopAnalytics() {
  const host = location.hostname;
  const domains = ['', host, '.' + host, '.' + host.replace(/^www\./, '')];
  document.cookie.split(';').map((c) => c.split('=')[0].trim()).filter((n) => /^_ga(_|$)/.test(n)).forEach((name) => {
    for (const d of domains) document.cookie = `${name}=; Max-Age=0; path=/${d ? '; domain=' + d : ''}`;
  });
  if (loaded) location.reload();
}
