// Wysyłka propozycji tematu (do 100 znaków) do Formularza Google. Wysyłamy wyłącznie treść tematu.
// Odpowiedź Google jest nieprzezroczysta (no-cors), więc sukces = brak błędu sieci. Limit: 1 na minutę, 5 na dobę.
const LIMIT_KEY = 'kontekstownik-topics';

// Prefiks kanału wchodzi do wysyłanej treści, więc liczy się do limitu 100 znaków.
const CHANNEL_TAG = { kids: '[Kids] ', influ: '[Influ] ' };
const LIMIT = 100;

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
    const channels = form.querySelector('[data-topic-channels]');
    const tagOf = () => CHANNEL_TAG[form.querySelector('input[name="topic-channel"]:checked')?.value] || '';
    const limit = () => LIMIT - tagOf().length;
    const sync = () => {
      input.maxLength = limit();
      if (input.value.length > input.maxLength) input.value = input.value.slice(0, input.maxLength);
      count.textContent = `${input.value.length}/${input.maxLength}`;
    };
    // Bez JS wybór kanału jest ukryty: temat trafia do Kontekstownika jak dotąd (Formularz Google ma jedno pole).
    if (channels) { channels.hidden = false; channels.addEventListener('change', () => { status.textContent = ''; sync(); }); }
    form.addEventListener('reset', () => setTimeout(sync));
    const say = (msg, ok) => { status.textContent = msg; status.dataset.state = ok ? 'ok' : 'err'; };

    input.addEventListener('input', () => { sync(); status.textContent = ''; });
    sync();

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const tag = tagOf();
      const text = input.value.trim().replace(/\s+/g, ' ');
      if (hp.value) return; // bot
      if (text.length < 3) { say(form.dataset.short, false); input.focus(); return; }
      const now = Date.now();
      const sent = recent().filter((t) => now - t < 86400000);
      if (sent.some((t) => now - t < 60000) || sent.length >= 5) { say(form.dataset.wait, false); return; }

      button.disabled = true;
      try {
        await fetch(form.action, { method: 'POST', mode: 'no-cors', body: new URLSearchParams({ [input.name]: tag + text }) });
        try { localStorage.setItem(LIMIT_KEY, JSON.stringify([...sent, now])); } catch { /* bez limitu w trybie prywatnym */ }
        form.reset();
        sync();
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
