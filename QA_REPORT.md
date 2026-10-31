# Raport QA – kontekstownik.pl

Data: 31.10.2026. Środowisko: build produkcyjny (`npm run build`) serwowany lokalnie przez `vite preview`,
Google Chrome (headless, Playwright), Lighthouse 12. **Strona nie jest jeszcze publiczna** (patrz „Wdrożenie”).

## Lighthouse (lokalnie, build produkcyjny)

| Profil | Performance | Accessibility | Best Practices | SEO | FCP | LCP | CLS | TBT | Waga |
|---|---|---|---|---|---|---|---|---|---|
| Mobile (Moto G, 4G throttling) | 100 | 100 | 100 | 100 | 1,1 s | 1,5 s | 0 | 0 ms | 38 KiB |
| Desktop | 100 | 100 | 100 | 100 | 0,3 s | 0,3 s | 0 | 0 ms | 38 KiB |

Raporty HTML: `docs/lighthouse/`. Lokalny podgląd nie wysyła nagłówków z `.htaccess` (cache, kompresja, CSP),
więc wynik na LH.pl trzeba powtórzyć po wdrożeniu (PageSpeed Insights).
W trakcie poprawiono: tekst 11 px na telefonie (audyt „font-size”) → min. 12 px; nazwy dostępne przycisków zaczynają się
od widocznej etykiety (audyt „label-content-name-mismatch”).

## Responsywność (`scripts/screenshots.mjs`, zrzuty w `docs/screenshots/`)

| Rozdzielczość | Poziomy scroll | Logo ucięte | Przyciski (szer. × wys.) | Nachodzenie |
|---|---|---|---|---|
| 320×568 | nie | nie | 288 × 58 | nie |
| 375×812 | nie | nie | 343 × 64 | nie |
| 390×844 | nie | nie | 358 × 64 | nie |
| 430×932 | nie | nie | 360 × 64 | nie |
| 844×390 (telefon poziomo) | nie | nie | 220 × 52 | nie |
| 768×1024 | nie | nie | 242 × 67 | nie |
| 1024×768 | nie | nie | 248 × 69 | nie |
| 1366×768 | nie | nie | 331 × 92 | nie |
| 1920×1080 | nie | nie | 465 × 129 | nie |
| 2560×1440 | nie | nie | 620 × 172 | nie |
| 1440×600 (niskie okno) | nie | nie | 258 × 72 | nie |

Wszystkie obszary dotykowe ≥ 52 px. Na każdym rozmiarze strona mieści się w jednym widoku.

## Testy funkcjonalne (`scripts/test-functional.mjs`) – 12/12

- Link YouTube → `https://www.youtube.com/@kontekstowniktv`, `target=_blank`, `rel="noopener noreferrer"` ✔
- Link TikTok → `https://www.tiktok.com/@kontekstownik`, jw. ✔
- Na stronie są dokładnie 2 linki, oba z nazwą dostępną ✔
- Tab: YouTube → TikTok, focus widoczny (pomarańczowy obrys 3 px) ✔ (`focus-keyboard-1366.png`)
- Hover YouTube zmienia poświatę ✔ (`hover-youtube-1366.png`)
- Globus narysowany na canvasie ✔, brak brakujących grafik ✔, brak błędów JS i konsoli ✔
- `prefers-reduced-motion`: panele i orbita bez animacji, globus statyczny ✔
- Wyłączony JavaScript: strona i przyciski działają ✔

Dodatkowo (curl, 31.10.2026): oba profile istnieją – YouTube zwraca kanał „KONTEKSTOWNIK”, TikTok profil `kontekstownik`.

## Zgodność z referencją

Porównanie 1:1 w tej samej rozdzielczości: `docs/screenshots/porownanie-referencja-vs-strona.png` (góra: projekt, dół: strona).
Zgodne: kompozycja i proporcje, logotyp z narożnikiem, hasło, linia, 4 kategorie z ikonami i separatorami, „Oglądaj nas na:”,
dwa przyciski o równej wadze, panele z lewej, globus z orbitą z prawej, siatka podłogi, smugi, odbicia przycisków, kolory.

Świadome różnice:
- **Panele** są ilustracjami SVG, nie zdjęciami. Referencja ma fotografie (gmach, tłum) bez źródła i licencji; zdjęcia
  wymagałyby zakupu/licencji i ważyłyby 10–20× więcej. Ilustracje zachowują motyw (instytucje, gospodarka, społeczeństwo)
  bez wizerunków osób, flag i symboli politycznych. Podmiana na licencjonowane zdjęcia: wymiana plików w `src/assets/panels/`.
- **Logotyp** odtworzony krojem Montserrat ExtraBold (brak oryginalnych plików logo). Zgodny wizualnie, ale nie identyczny
  piksel w piksel z grafiką. Po otrzymaniu pliku SVG logo – podmiana opisana w `DESIGN_SYSTEM.md`.
- **Wordmark YouTube** zapisany fontem strony (oryginalny krój YouTube Sans jest zastrzeżony); ikony YouTube i TikTok oryginalne.
- Globus jest kropkowy i obraca się (referencja to statyczny render).

## Czego nie przetestowano

- Safari / iOS i Firefox na prawdziwych urządzeniach (testy tylko w Chrome/Chromium). Ryzyko niskie: użyte funkcje
  (`clip-path`, `mask-image`, `@property`, canvas) są wspierane; `-webkit-box-reflect` w Firefoksie nie działa i jest zastąpione
  poświatą `::after`. `@property` (unoszenie paneli, orbita) wymaga Firefox 128+/Safari 16.4+; starsze przeglądarki pokażą elementy bez ruchu.
- Publiczna domena, SSL, przekierowania HTTPS/www, nagłówki `.htaccess` – **nie do sprawdzenia**, bo domena nie ma
  jeszcze rekordów A ani hostingu. Gotowy test: `./scripts/verify-live.sh` (31.10.2026: DNS i SSL – FAIL, zgodnie ze stanem).

## Wdrożenie

Status: **nieopublikowane**. Brakująca czynność: dodanie domeny do serwera hostingowego w panelu LH.pl i dane FTP/SFTP.
Instrukcja: `DEPLOY_LH.md`.
