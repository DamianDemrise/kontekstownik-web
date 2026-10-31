// Tagi kategorii i sortowanie kart materiałów. Działa na gotowym HTML; bez JS widać wszystkie karty w kolejności od najnowszych.
export function initMaterialsTools() {
  const tools = document.querySelector('[data-mtools]');
  const grid = document.querySelector('[data-mgrid]');
  if (!tools || !grid) return;
  const items = [...grid.children];
  const status = tools.querySelector('[data-mtools-status]');
  let filter = 'all';
  let order = 'newest';

  const apply = () => {
    const sorted = [...items].sort((a, b) => (order === 'newest' ? -1 : 1) * a.dataset.date.localeCompare(b.dataset.date));
    sorted.forEach((li) => {
      li.hidden = filter !== 'all' && li.dataset.category !== filter;
      grid.appendChild(li);
    });
    const shown = sorted.filter((li) => !li.hidden).length;
    if (status) status.textContent = status.dataset.template.replace('{n}', shown);
  };
  const press = (sel, btn) => tools.querySelectorAll(sel).forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));

  tools.addEventListener('click', (e) => {
    const chip = e.target.closest('[data-filter]');
    const sort = e.target.closest('[data-sort]');
    if (chip) { filter = chip.dataset.filter; press('[data-filter]', chip); apply(); }
    if (sort) { order = sort.dataset.sort; press('[data-sort]', sort); apply(); }
  });
  tools.hidden = false;
}
