# kontekstownik.pl

Jednoekranowa strona startowa kanału KONTEKSTOWNIK. Jedyny cel: przekierować na YouTube albo TikToka.
Statyczny HTML + CSS + ~3 KB JS (globus i paralaksa doładowywane po renderze). Bez backendu, bazy, CMS i analityki.
Hosting: GitHub Pages (push na `main` publikuje), domena i DNS w LH.pl. Działa też na zwykłym hostingu LH.pl (FTP).

## Komendy

| Komenda | Co robi |
|---|---|
| `npm install` | zależności deweloperskie (Vite, Playwright do testów) |
| `npm run dev` | serwer deweloperski http://localhost:5178 |
| `npm run build` | build do `dist/` + kontrola plików i ścieżek (`scripts/check-dist.mjs`) |
| `npm run preview` | podgląd builda http://localhost:4188 |
| `npm test` | zrzuty 11 rozdzielczości + testy funkcjonalne (wymaga `npm run preview`) |
| `npm run zip` | `release/kontekstownik-dist-RRRR-MM-DD.zip` gotowe do wgrania |
| `git push` | publikacja na GitHub Pages (workflow `.github/workflows/deploy.yml`) |
| `npm run deploy` | tylko wariant hostingu LH.pl: podgląd wdrożenia FTP; `-- --wyslij` wysyła |
| `npm run verify-live` | kontrola publicznej strony: DNS, SSL, przekierowania, zasoby, linki |
| `npm run materialy:check` | walidacja `content/materialy.json` i okładek |
| `npm run build:przyklad` | build z przykładowymi materiałami (`content/przyklad/`) – tylko do podglądu |
| `npm run assets` | regeneracja danych globusa (rzadko) |

Ikony i `og-image.jpg`: `node scripts/build-icons.mjs` (przy działającym `npm run preview`). Font: `scripts/subset-font.sh`.

## Struktura

```
index.html                 cała treść strony, meta SEO, JSON-LD
src/styles/                tokens · base · scene (tło, panele, globus) · hero · cta · motion · responsive
src/scripts/               main.js (wejście) · globe.js (canvas) · globe-data.js (generowane) · parallax.js
src/assets/panels/         4 ilustracje SVG paneli informacyjnych
content/                   materialy.json + okladki/ (sekcja materiałów), przyklad/ do testów
public/                    font, ikony, og-image, robots, sitemap, manifest, .htaccess, 404
scripts/                   build/test/deploy
docs/                      referencja, zrzuty ekranu, raporty Lighthouse
```

## Dokumenty

| Plik | Kiedy czytać |
|---|---|
| `DESIGN_SYSTEM.md` | zmiana wyglądu: kolory, typografia, siatka, animacje |
| `DEPLOY_LH.md` | publikacja (GitHub Pages), rekordy DNS w LH.pl, SSL, wariant FTP |
| `QA_REPORT.md` | wyniki testów, Lighthouse, znane ograniczenia |
| `content/README.md` | jak dodać materiał wideo (okładka + wpis), zasady dla Codexa |
| `WSPOLPRACA_CLAUDE_CODEX.md` | ustalenia z Codexem |
| `CLAUDE.md` | zasady pracy agenta w tym repo |

## Analityka i zgoda (od 31.10.2026)

- **GA4:** konto „Damian Dobroliński”, usługa `kontekstownik.pl` (`properties/561705729`), strumień `G-BL7K5L49H5`
  (`src/scripts/config.js`). Retencja 14 mies., Google Signals i sygnały reklamowe wyłączone.
- **Consent Mode v2, tryb podstawowy:** bez zgody nie ładuje się nic zewnętrznego i nie powstają cookies.
  Baner: `src/scripts/consent.js` + `src/styles/consent.css`; wybór w `localStorage` (`kontekstownik-consent`).
  Zmiana zakresu zgody → podbij `CONSENT_VERSION`, baner wróci u wszystkich.
- **Zdarzenie kluczowe:** `platform_click` z parametrem `platform` = `youtube` | `tiktok` (wymiar niestandardowy „Platforma”).
  Wysyła `src/scripts/analytics.js` dla każdego `a[data-platform]`.
- **Polityka prywatności:** `polityka-prywatnosci/index.html`. Przy dodaniu narzędzia (np. Meta Pixel) zaktualizuj ją razem z banerem.
- Testy zgody i zdarzeń: `scripts/test-functional.mjs` (nic nie wysyła do GA).
