# CLAUDE.md – kontekstownik-web

Statyczna strona startowa kontekstownik.pl (Vite → `dist/`, GitHub Pages, DNS w LH.pl). Szczegóły: `README.md`.

- Wygląd odwzorowuje zatwierdzoną referencję `docs/referencja.webp`. Zmiany wyglądu tylko świadome, opisane w `DESIGN_SYSTEM.md`.
- Gdzie co jest: treść i SEO `index.html`; wygląd `src/styles/<obszar>.css`; ruch `motion.css`; mobile `responsive.css`; globus `src/scripts/globe.js`.
- Weryfikacja po zmianie: `npm run build` → `npm run preview` → `npm test`. Zrzuty w `docs/screenshots/`.
- Nie dodawać: menu, sekcji, formularzy, analityki, cookies, zewnętrznych skryptów i fontów (CSP w `public/.htaccess` to zablokuje).
  Wyjątek (zamówienie Damiana, 2.11.2026): strona główna to centrum trzech kanałów (przełącznik Kontekstownik/Kids/Influ, kafelki marek, pasy „Najnowsze”, formularz tematu z wyborem kanału). Logo kafelków: `public/brand/<marka>/logo.png`; układ w `scripts/home-render.mjs` i `src/styles/home.css`.
- Push na `main` = publikacja na produkcję. Pushuj tylko po akceptacji Damiana. Repo publiczne: zero sekretów.
- Materiały wideo: tylko przez `content/` wg `content/README.md`; nigdy odtwarzacz/iframe na stronie. Nowy materiał publikujemy po akceptacji Damiana.
- Kolory platform tylko w `cta.css`. Pomarańcz marki `#FF8A00` bez zmian.
