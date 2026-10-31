// Baner zgody na cookies analityczne. Wybór w localStorage; bez zgody nic zewnętrznego się nie ładuje.
import { CONSENT_KEY, CONSENT_VERSION } from './config.js';
import { startAnalytics, stopAnalytics } from './analytics.js';

function read() {
  try {
    const v = JSON.parse(localStorage.getItem(CONSENT_KEY));
    return v && v.v === CONSENT_VERSION ? v : null;
  } catch { return null; }
}

function save(analytics) {
  try { localStorage.setItem(CONSENT_KEY, JSON.stringify({ v: CONSENT_VERSION, analytics, date: new Date().toISOString() })); } catch { /* tryb prywatny: wybór tylko na tę wizytę */ }
}

export function initConsent() {
  const banner = document.getElementById('consent');
  if (!banner) return;
  // Bez automatycznego fokusu: obrys wyróżniałby „Akceptuję”, a oba przyciski mają mieć tę samą wagę.
  const show = () => { banner.hidden = false; };
  const hide = () => { banner.hidden = true; };

  banner.addEventListener('click', (e) => {
    const choice = e.target.closest('[data-consent]')?.dataset.consent;
    if (!choice) return;
    const accepted = choice === 'accept';
    const before = read();
    save(accepted);
    hide();
    if (accepted) startAnalytics();
    else if (before?.analytics) stopAnalytics();
  });

  document.querySelectorAll('[data-consent-open]').forEach((b) => b.addEventListener('click', show));

  const current = read();
  if (!current) show();
  else if (current.analytics) startAnalytics();
}
