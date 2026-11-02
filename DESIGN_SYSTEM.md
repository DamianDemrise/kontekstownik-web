# Design system KONTEKSTOWNIK (strona startowa)

Źródło: zatwierdzona grafika `docs/referencja.webp` (1672×941). Strona odwzorowuje ją elementami HTML/CSS/SVG/canvas,
bez obrazu tła z niewidzialnymi polami klikalnymi.

## Kolory (`src/styles/tokens.css`)

| Token | Wartość | Użycie |
|---|---|---|
| `--bg` | `#080D12` | tło |
| `--surface` | `#101820` | panele |
| `--white` | `#F5F7FA` | tekst |
| `--muted` | `#AEB9C4` | tekst pomocniczy, 404 |
| `--orange` | `#FF8A00` | narożnik logo, linia pod hasłem, separatory, orbita, smugi |
| YouTube | `#FF0000` | tylko przycisk YouTube |
| TikTok | `#25F4EE` / `#FE2C55` | tylko przycisk TikTok |

Kontrast: biel na tle 18:1, pomarańcz na tle 8,2:1 (dekoracja, nie tekst).

## Typografia

Jedna rodzina: **Montserrat Variable** (SIL OFL, użycie komercyjne dozwolone), podzbiór łacina + polskie znaki,
wagi 400–800, dwa pliki z `unicode-range`: `montserrat-latin-v2.woff2` (22 KB) i `montserrat-latin-ext-v2.woff2`
(7 KB, polskie znaki), `font-display: swap`, preload obu. Generuje `scripts/subset-font.sh`.
Montserrat zamiast Inter: logotyp w referencji ma geometryczne, szerokie litery (K, O, W), których Inter nie oddaje.

| Element | Waga | Rozmiar (desktop) | Uwagi |
|---|---|---|---|
| Logo `h1` | 800 | `6.4u` | narożnik 0,12 em, pomarańczowy |
| Hasło | 500 | `1.4u`, min 12 px | rozstrzelenie 0,32 em, wersaliki |
| Kategorie | 700 | `1.15u`, min 12 px | wersaliki |
| „Oglądaj nas na:” `h2` | 500 | `1.25u` | rozstrzelenie 0,36 em |
| Przyciski | 700 | `2.75u`, min 20 px | |

## Jednostka kompozycji

`--u = min(1vw, 1.78vh)`: 1% szerokości, ale ograniczone wysokością w proporcji 16:9. Cała kompozycja (logo, odstępy,
panele, globus) skaluje się tą jednostką, więc proporcje referencji zostają od 1366 px do 4K, a na niskich
oknach nic nie wychodzi poza ekran. Tablet pionowo: `min(1.45vw, 1.05vh)`. Telefon (≤640 px): osobny układ w pikselach.

## Układ

- Desktop: logo → hasło → linia → 4 kategorie z separatorami → „Oglądaj nas na:” → 2 przyciski obok siebie.
  Panele z lewej (perspektywa `rotateY`), globus z prawej, przycięty krawędzią ekranu, podłoga z siatką, smugi przy krawędziach.
- Tablet pionowo: panele nad treścią, globus pod nią.
- Telefon: kolumna, kategorie 2×2, przyciski jeden pod drugim (64 px wysokości, pełna szerokość do 360 px),
  panele i globus zmniejszone i przygaszone w rogach.
- Telefon poziomo / niskie okno: zwarty układ, przewijanie zamiast ściskania tekstu.

## Elementy

- **Panele** (`src/assets/panels/*.svg`): wykresy słupkowe (gospodarka), gmach z kolumnadą (instytucje), tłum na ulicy
  (społeczeństwo), wykres liniowy z pomarańczową krawędzią. Monochromatyczne, bez flag, symboli i wizerunków osób.
- **Globus**: canvas, rzut ortograficzny ~4 500 punktów lądów (Natural Earth 110m, domena publiczna), oświetlenie z lewej,
  poświata krawędzi w CSS, pomarańczowa orbita z maską `conic-gradient`.
- **Przyciski**: identyczne wymiary, typografia i siła poświaty; różni je tylko kolorystyka platformy.

## Ruch (`motion.css`, `globe.js`, `parallax.js`)

| Co | Jak | Czas |
|---|---|---|
| Wejście | tło → logo (odsłonięcie `clip-path`) → narożnik → hasło → linia → kategorie (kaskada) → przyciski | ~1,5 s łącznie |
| Globus | obrót 0,9°/s, 30 kl./s, pauza poza ekranem i w ukrytej karcie | ciągły |
| Orbita | wahanie ±8° i pulsowanie jasności | 14 s / 6 s |
| Panele | unoszenie ±9 px, różne okresy | 8–13 s |
| Paralaksa | panele i globus za kursorem (tylko mysz) | lerp |
| Przyciski | hover: mocniejsza poświata, uniesienie 2 px, strzałka +4 px; klik: skala 0,975 | 0,35 s |

Przyciski są klikalne od pierwszej klatki (animacja nie blokuje zdarzeń). `prefers-reduced-motion`: brak animacji,
globus rysowany raz, brak paralaksy. Skrypty ładują się po zdarzeniu `load`, więc nie opóźniają LCP.

## Logo

Nie dostarczono plików logo. Logotyp jest odtworzony z referencji jako tekst (Montserrat 800) + pomarańczowy narożnik w CSS,
więc pozostaje prawdziwym `h1`. Gdy będą oryginalne pliki (SVG), podmień zawartość `.brand__logo` na `<img>`/inline SVG
z `alt="KONTEKSTOWNIK"` i zachowaj `h1`. Favicon (K + narożnik) jest pochodną tego zapisu.


## Trzy kanały — zmiana Damiana 2.11.2026

Nawigacja w górnym nagłówku przełącza zwykłymi linkami `/`, `/kids/`, `/influ/` i działa bez JavaScript.
Główna strona zachowuje kompozycję, pomarańcz, treść, adresy materiałów oraz SEO. Nowe landingi używają
Montserrat i tej samej hierarchii: marka → temat → przyciski kanałów → opublikowany materiał.
Kids korzysta z niezmienionego logo Kids, tła turkusowego i żółtych wyróżnień; Influ z istniejącego logo,
ciemnego tła oraz różowo-niebieskich poświat. Nie kopiujemy sloganu głównego kanału.
Kanały i materiały to zwykłe linki zewnętrzne; bez odtwarzaczy i skryptów platform. Profil TikTok Kids
nie jest promowany, ponieważ publikacje TikTok Kids są odłożone. Materiał Andziaks pokazuje potwierdzone publikacje YouTube, Instagram i TikTok.
Kids pokazuje 4 opublikowane filmy z serii „Gry, bajki i internet” z linkami Instagram.
Źródła treści nowych landingów: `scripts/brands.mjs`; wygląd: `src/styles/brands.css`.
