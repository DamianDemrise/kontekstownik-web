# CLAUDE.md – kontekstownik-web

Statyczna strona startowa kontekstownik.pl (Vite → `dist/`, hosting LH.pl). Szczegóły: `README.md`.

- Wygląd odwzorowuje zatwierdzoną referencję `docs/referencja.webp`. Zmiany wyglądu tylko świadome, opisane w `DESIGN_SYSTEM.md`.
- Gdzie co jest: treść i SEO `index.html`; wygląd `src/styles/<obszar>.css`; ruch `motion.css`; mobile `responsive.css`; globus `src/scripts/globe.js`.
- Weryfikacja po zmianie: `npm run build` → `npm run preview` → `npm test`. Zrzuty w `docs/screenshots/`.
- Nie dodawać: menu, sekcji, formularzy, analityki, cookies, zewnętrznych skryptów i fontów (CSP w `public/.htaccess` to zablokuje).
- Wdrożenie wyłącznie `scripts/deploy-lh.sh` (podgląd domyślnie, `--wyslij` na wyraźne polecenie). Hasło tylko w pęku kluczy.
- Kolory platform tylko w `cta.css`. Pomarańcz marki `#FF8A00` bez zmian.
