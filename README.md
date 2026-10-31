# kontekstownik.pl

Jednoekranowa strona startowa kanału KONTEKSTOWNIK. Jedyny cel: przekierować na YouTube albo TikToka.
Statyczny HTML + CSS + ~3 KB JS (globus i paralaksa doładowywane po renderze). Bez backendu, bazy, CMS i analityki.
Działa na zwykłym hostingu współdzielonym LH.pl.

## Komendy

| Komenda | Co robi |
|---|---|
| `npm install` | zależności deweloperskie (Vite, Playwright do testów) |
| `npm run dev` | serwer deweloperski http://localhost:5178 |
| `npm run build` | build do `dist/` + kontrola plików i ścieżek (`scripts/check-dist.mjs`) |
| `npm run preview` | podgląd builda http://localhost:4188 |
| `npm test` | zrzuty 11 rozdzielczości + testy funkcjonalne (wymaga `npm run preview`) |
| `npm run zip` | `release/kontekstownik-dist-RRRR-MM-DD.zip` gotowe do wgrania |
| `npm run deploy` | podgląd wdrożenia na LH.pl (kopia zdalna + różnice); `-- --wyslij` wysyła |
| `npm run verify-live` | kontrola publicznej strony: DNS, SSL, przekierowania, zasoby, linki |
| `npm run assets` | regeneracja danych globusa (rzadko) |

Ikony i `og-image.jpg`: `node scripts/build-icons.mjs` (przy działającym `npm run preview`). Font: `scripts/subset-font.sh`.

## Struktura

```
index.html                 cała treść strony, meta SEO, JSON-LD
src/styles/                tokens · base · scene (tło, panele, globus) · hero · cta · motion · responsive
src/scripts/               main.js (wejście) · globe.js (canvas) · globe-data.js (generowane) · parallax.js
src/assets/panels/         4 ilustracje SVG paneli informacyjnych
public/                    font, ikony, og-image, robots, sitemap, manifest, .htaccess, 404
scripts/                   build/test/deploy
docs/                      referencja, zrzuty ekranu, raporty Lighthouse
```

## Dokumenty

| Plik | Kiedy czytać |
|---|---|
| `DESIGN_SYSTEM.md` | zmiana wyglądu: kolory, typografia, siatka, animacje |
| `DEPLOY_LH.md` | publikacja na LH.pl, DNS, SSL, przekierowania |
| `QA_REPORT.md` | wyniki testów, Lighthouse, znane ograniczenia |
| `CLAUDE.md` | zasady pracy agenta w tym repo |

## Pomiar kliknięć (na później)

Linki mają `data-platform="youtube|tiktok"`. Gdy przyjdzie decyzja o analityce, wystarczy jeden moduł
w `src/scripts/` nasłuchujący kliknięć `a[data-platform]` i baner zgód, jeśli narzędzie używa cookies.
Wtedy trzeba też poszerzyć CSP w `public/.htaccess`. Teraz celowo nic nie mierzymy.
