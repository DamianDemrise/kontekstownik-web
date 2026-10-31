// Wysyłka propozycji tematu (do 100 znaków) do Formularza Google. Wysyłamy wyłącznie treść tematu.
// Odpowiedź Google jest nieprzezroczysta (no-cors), więc sukces = brak błędu sieci. Limit: 1 na minutę, 5 na dobę.
const LIMIT_KEY = 'kontekstownik-topics';

function recent() {
  try { return JSON.parse(localStorage.getItem(LIMIT_KEY)) || []; } catch { return []; }
}

export function initTopicForms() {
  document.querySelectorAll('[data-topic-form]').forEach((form) => {
    const input = form.querySelector('input[name^="entry."]');
    const count = form.querySelector('[data-topic-count]');
    const status = form.querySelector('[data-topic-status]');
    const hp = form.querySelector('[data-topic-hp]');
    const button = form.querySelector('button[type="submit"]');
    const say = (msg, ok) => { status.textContent = msg; status.dataset.state = ok ? 'ok' : 'err'; };

    input.addEventListener('input', () => { count.textContent = `${input.value.length}/100`; status.textContent = ''; });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const text = input.value.trim().replace(/\s+/g, ' ');
      if (hp.value) return; // bot
      if (text.length < 3) { say(form.dataset.short, false); input.focus(); return; }
      const now = Date.now();
      const sent = recent().filter((t) => now - t < 86400000);
      if (sent.some((t) => now - t < 60000) || sent.length >= 5) { say(form.dataset.wait, false); return; }

      button.disabled = true;
      try {
        await fetch(form.action, { method: 'POST', mode: 'no-cors', body: new URLSearchParams({ [input.name]: text }) });
        try { localStorage.setItem(LIMIT_KEY, JSON.stringify([...sent, now])); } catch { /* bez limitu w trybie prywatnym */ }
        form.reset();
        count.textContent = '0/100';
        say(form.dataset.ok, true);
        window.gtag?.('event', 'topic_suggest'); // tylko fakt wysłania, nigdy treść
      } catch {
        say(form.dataset.err, false);
      } finally {
        button.disabled = false;
      }
    });
  });
}
