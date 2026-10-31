# Raport QA – kontekstownik.pl

Data: 31.10.2026. Środowisko: build produkcyjny (`npm run build`) serwowany lokalnie przez `vite preview`,
Google Chrome (headless, Playwright), Lighthouse 12. Publikacja: GitHub Pages (patrz „Wdrożenie”).

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

## Analityka i zgoda (31.10.2026) – 13 testów, wszystkie ok

- Pierwsza wizyta: baner widoczny, **przed zgodą 0 żądań do Google i 0 cookies** ✔
- „Odrzucam”: baner znika, nic się nie ładuje, wybór pamiętany po przeładowaniu ✔
- „Akceptuję”: ładuje się gtag.js, powstają `_ga` i `_ga_BL7K5L49H5`, wysyłany `page_view` ✔
- Klik YouTube → `platform_click` z `platform=youtube`; TikTok → `platform=tiktok` ✔
- „Ustawienia cookies” w stopce otwiera baner; wycofanie zgody usuwa cookies `_ga*` i wyłącza GA ✔
- Baner na telefonie: przyciski 46 px, oba o tej samej wadze (bez automatycznego fokusu na „Akceptuję”) ✔
- Polityka prywatności pod `/polityka-prywatnosci/` ✔ (zrzuty: `consent-banner-*.png`, `polityka-390.png`)
- Lighthouse po dodaniu banera: nadal 100/100/100/100 (mobile i desktop).

Uwaga: pierwsze przebiegi testów przed zablokowaniem `sendBeacon` mogły wysłać do GA kilka zdarzeń z hosta `localhost`
(31.10.2026 ok. 10:00). Nie mają wpływu na dane produkcyjne po tej dacie.

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
- Nagłówki z `.htaccess` (CSP, cache) – nie działają na GitHub Pages, plik dotyczy tylko wariantu hostingu LH.pl.

## Wdrożenie

GitHub Pages (`DamianDemrise/kontekstownik-web`) + DNS w LH.pl, szczegóły w `DEPLOY_LH.md`. Wynik kontroli publicznej
strony: sekcja „Kontrola produkcji” poniżej.

## Kontrola produkcji (https://www.kontekstownik.pl, 31.10.2026 ok. 10:15)

- `./scripts/verify-live.sh`: **28/28 ok** – DNS (4×A + CNAME www), certyfikat Let's Encrypt dla `kontekstownik.pl`
  i `www.kontekstownik.pl` (ważny do 29.01.2027, odnawia GitHub), wszystkie warianty adresu kończą na `https://www.kontekstownik.pl/`
  (`http://kontekstownik.pl` przez 2 przekierowania – tak działa GitHub Pages), linki YouTube/TikTok w HTML, wszystkie zasoby 200, strona 404.
- `scripts/test-functional.mjs` na produkcji: **25/25 ok** (w tym zgoda i zdarzenia GA – zablokowane, nie trafiły do statystyk).
- `scripts/screenshots.mjs` na produkcji: 11/11 rozdzielczości ok.
- Lighthouse na produkcji: mobile 100/100/100/100 (LCP 1,1 s), desktop 99/100/100/100 (LCP 0,6 s), CLS 0.

Uwaga do testów z tego Maca: system pamiętał „brak domeny” sprzed zmiany DNS, dlatego skrypty łączą się pod adresy z `dig`
(`verify-live.sh` sam, testy Playwright przez `CHROME_ARGS="--host-resolver-rules=MAP www.kontekstownik.pl 185.199.108.153"`).
