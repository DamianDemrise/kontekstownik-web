import { paginate } from './materials-paging.js';

// Tagi kategorii, sortowanie i stronicowanie (po 9) kart materiałów. Działa na gotowym HTML; bez JS widać wszystkie karty w kolejności od najnowszych.
export function initMaterialsTools() {
  const tools = document.querySelector('[data-mtools]');
  const grid = document.querySelector('[data-mgrid]');
  if (!tools || !grid) return;
  const items = [...grid.children];
  const featured = Math.min(Number(grid.dataset.featured) || 0, Math.max(items.length - 1, 0));
  const status = tools.querySelector('[data-mtools-status]');
  let filter = 'all';
  let order = 'newest';
  let page = 1;
  const pager = document.querySelector('[data-mpager]');
  const prev = pager?.querySelector('[data-page-prev]');
  const next = pager?.querySelector('[data-page-next]');
  const state = pager?.querySelector('[data-page-state]');

  const apply = () => {
    const sorted = [...items].sort((a, b) => (order === 'newest' ? -1 : 1) * a.dataset.date.localeCompare(b.dataset.date));
    // Na stronie głównej najnowsze karty są już w pasie „Najnowsze”: domyślny widok listy zaczyna się od kolejnych.
    // Filtr kategorii i sortowanie „od najstarszych” pokazują komplet.
    const base = filter === 'all' && order === 'newest' ? sorted.slice(featured) : sorted;
    const matching = base.filter((li) => filter === 'all' || li.dataset.category === filter);
    const p = paginate(matching.length, page);
    page = p.page;
    const onPage = new Set(matching.slice(p.from, p.to));
    sorted.forEach((li) => {
      li.hidden = !onPage.has(li);
      grid.appendChild(li);
    });
    if (status) status.textContent = status.dataset.template.replace('{n}', matching.length);
    if (pager) {
      pager.hidden = p.pages < 2;
      prev.disabled = p.page <= 1;
      next.disabled = p.page >= p.pages;
      state.textContent = state.dataset.template.replace('{n}', p.page).replace('{total}', p.pages);
    }
  };
  // Po zmianie strony: początek listy w widoku, a fokus nie ginie na zablokowanym przycisku.
  const turn = (delta, btn) => {
    page += delta;
    apply();
    if (btn.disabled) state.focus({ preventScroll: true });
    tools.scrollIntoView({ block: 'start', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  };
  prev?.addEventListener('click', () => turn(-1, prev));
  next?.addEventListener('click', () => turn(1, next));
  const press = (sel, btn) => tools.querySelectorAll(sel).forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));

  tools.addEventListener('click', (e) => {
    const chip = e.target.closest('[data-filter]');
    const sort = e.target.closest('[data-sort]');
    if (chip) { filter = chip.dataset.filter; page = 1; press('[data-filter]', chip); apply(); }
    if (sort) { order = sort.dataset.sort; page = 1; press('[data-sort]', sort); apply(); }
  });
  apply();
  tools.hidden = false;
}
