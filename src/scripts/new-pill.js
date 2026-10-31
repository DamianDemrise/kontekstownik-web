// Przyklejony pasek „Nowy materiał ↓”: pojawia się chwilę po wejściu (a jeśli jest baner zgody – dopiero
// po decyzji, żeby na telefonie nie zasłaniać przycisków), znika po dotarciu do sekcji albo po zamknięciu.
const DISMISS_KEY = 'kontekstownik-pill-closed';

export function initNewPill() {
  const pill = document.querySelector('[data-new-pill]');
  const section = document.getElementById('materialy');
  if (!pill || !section) return;
  try { if (sessionStorage.getItem(DISMISS_KEY)) return; } catch { /* brak sessionStorage: pokazujemy normalnie */ }

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let done = false;

  const hide = () => {
    pill.classList.add('is-off');
    setTimeout(() => { pill.hidden = true; }, reduced ? 0 : 400);
  };
  const finish = () => { if (!done) { done = true; hide(); } };

  const banner = document.getElementById('consent');
  const bannerOpen = () => banner && !banner.hidden;
  let timeUp = false;
  const show = () => {
    if (done || !timeUp || bannerOpen() || !pill.hidden) return;
    pill.classList.add('is-off');
    pill.hidden = false;
    requestAnimationFrame(() => requestAnimationFrame(() => pill.classList.remove('is-off')));
  };
  if (banner) new MutationObserver(show).observe(banner, { attributes: true, attributeFilter: ['hidden'] });

  new IntersectionObserver(([e]) => { if (e.isIntersecting) finish(); }, { threshold: 0.15 }).observe(section);

  pill.querySelector('[data-new-pill-link]').addEventListener('click', (e) => {
    e.preventDefault();
    section.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
    section.querySelector('.card__main')?.focus({ preventScroll: true });
    finish();
  });
  pill.querySelector('[data-new-pill-close]').addEventListener('click', () => {
    try { sessionStorage.setItem(DISMISS_KEY, '1'); } catch { /* tylko na tę stronę */ }
    finish();
  });

  setTimeout(() => { timeUp = true; show(); }, reduced ? 0 : 1400);
}
