// „Czy ten materiał pomógł?”: wysyła id materiału, ocenę (tak/nie) i język do Formularza Google. Jedna ocena na materiał w przeglądarce.
const KEY = 'kontekstownik-ratings';

const stored = () => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; } };

export function initRatings() {
  document.querySelectorAll('[data-rating]').forEach((box) => {
    const status = box.querySelector('[data-rate-status]');
    const buttons = [...box.querySelectorAll('[data-rate]')];
    const lock = (value) => buttons.forEach((b) => { b.disabled = true; b.setAttribute('aria-pressed', String(b.dataset.rate === value)); });

    const prev = stored()[box.dataset.material];
    if (prev) { lock(prev); status.textContent = box.dataset.done; return; }

    buttons.forEach((b) => b.addEventListener('click', async () => {
      const value = b.dataset.rate;
      lock(value);
      try {
        const body = new URLSearchParams({ [box.dataset.fMaterial]: box.dataset.material, [box.dataset.fRating]: `${value} (${box.dataset.lang})` });
        await fetch(box.dataset.action, { method: 'POST', mode: 'no-cors', body });
        try { localStorage.setItem(KEY, JSON.stringify({ ...stored(), [box.dataset.material]: value })); } catch { /* tryb prywatny */ }
        status.textContent = box.dataset.thanks;
        window.gtag?.('event', 'material_rating', { material_id: box.dataset.material, value });
      } catch {
        buttons.forEach((x) => { x.disabled = false; x.removeAttribute('aria-pressed'); });
        status.textContent = box.dataset.err;
      }
    }));
  });
}
