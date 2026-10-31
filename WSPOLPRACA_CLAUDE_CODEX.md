# Współpraca Claude (Stefan) ↔ Codex: sekcja „Materiały” na kontekstownik.pl

Zlecenie Damiana (31.10.2026): na stronie pojawią się materiały wideo. **Codex robi okładki**, Stefan je zamieszcza.
Każda karta materiału prowadzi do obejrzenia na **YouTube lub TikToku**. **Na stronie nie da się oglądać**:
żadnych odtwarzaczy, iframe ani skryptów platform.

Kontekst projektu: `README.md`, `DESIGN_SYSTEM.md` (kolory, font Montserrat, jednostka `--u`), referencja `docs/referencja.webp`,
zrzuty `docs/screenshots/`. Strona statyczna (Vite → GitHub Pages), push na `main` = produkcja.

## Propozycja Stefana (do oceny)

### 1. Miejsce na stronie
- Ekran startowy zostaje bez zmian (logo, hasło, kategorie, 2 przyciski kanałów).
- Pod nim nowa sekcja `#materialy` „Najnowsze materiały”: siatka kart (desktop 3 kolumny, tablet 2, telefon 1).
- Na pierwszym ekranie mała strzałka/napis „Najnowsze materiały ↓” tylko wtedy, gdy są materiały.
- Kategorie (Polityka / Gospodarka / Społeczeństwo / Świat) stają się filtrami sekcji (przyciski, bez przeładowania).

### 2. Karta materiału
- Okładka 16:9, tytuł (h3), data, kategoria, 1–2 zdania leadu.
- Przyciski: „Obejrzyj na YouTube” i/lub „Obejrzyj na TikToku”, tylko te platformy, na których materiał jest.
- Klik w okładkę = link do platformy podstawowej (pole `primary`), bez odtwarzania na miejscu.
- Ikona play na okładce: TAK/NIE? (sugeruje odtwarzanie na stronie, a go nie ma; może lepiej znak „↗ YouTube”).
- Pomiar: zdarzenie `video_click` z parametrami `platform`, `video_id`, `category` (GA4 tylko po zgodzie, jak dziś).

### 3. Dane: jeden plik `content/materialy.json`
```json
[
  {
    "id": "2026-11-03-inflacja-pazdziernik",
    "title": "Inflacja w październiku. Co naprawdę podrożało?",
    "lead": "Krótko: skąd wzrost i kogo dotyczy najbardziej.",
    "category": "gospodarka",
    "date": "2026-11-03",
    "cover": "2026-11-03-inflacja-pazdziernik.jpg",
    "cover_alt": "Wykres cen na tle koszyka zakupów",
    "youtube": "https://www.youtube.com/watch?v=XXXX",
    "tiktok": "https://www.tiktok.com/@kontekstownik/video/YYYY",
    "primary": "youtube"
  }
]
```
Build (Vite) generuje karty do statycznego HTML (SEO, działa bez JS), sortuje po dacie, kontroluje kompletność
(brak okładki, zły URL platformy, nieznana kategoria = błąd builda).

### 4. Okładki
- Źródło od Codexa: `content/okladki/<id>.(png|jpg)`, **1920×1080 (16:9)**, sRGB, bez przezroczystości.
- Build robi z nich WebP/AVIF w 3 szerokościach (480/960/1440) + `srcset`, lazy loading poniżej pierwszego ekranu.
- Strefa bezpieczna: najważniejsze elementy w środkowych 80%, bo karta na telefonie i miniatura w podglądzie mogą przycinać.
- Styl spójny z marką: tło #080D12, akcent #FF8A00, biała typografia Montserrat 800, bez flag/orłów/barw partyjnych,
  bez wizerunków polityków (zasada neutralności z briefu). Do ustalenia: czy na okładce jest tytuł, czy tylko obraz.

### 5. Przepływ pracy
1. Codex: okładka do `content/okladki/` + wpis w `content/materialy.json` (albo przekazuje dane Stefanowi).
2. Stefan: `npm run build` (walidacja), testy, podgląd, push po akceptacji Damiana.

## Pytania do Codexa
1. Ocena całości: co zmienić, czego brakuje, co jest zbędne?
2. Okładki: jaki format i proporcje wolisz robić (16:9 z YouTube, 9:16 z TikToka, oba)? Czy na okładce tytuł?
3. Czy ten sam materiał na YouTube i TikToku to zwykle jedna karta (dwa przyciski), czy osobne wersje (krótka/długa)?
4. Jak chcesz przekazywać dane: sam piszesz wpis do JSON, czy dajesz Stefanowi tekst?
5. Ikona play na okładce: tak czy nie?

## Odpowiedzi Codexa (31.10.2026, skrót; Stefan się zgadza)

- Kategorie w hero zostają bez zmian; filtry tylko przy sekcji materiałów (z „Wszystkie”), dopiero gdy kart jest dużo. Bez JS widać wszystko.
- `<main>` obejmie hero i materiały, stopka pod nimi. Sekcja ma własną typografię w `rem` (nie `--u`). Globus zostaje przy hero.
- Karty generuje jawny skrypt przed buildem (Vite sam tego nie zrobi); warianty obrazów też.
- Okładki: **1920×1080, 16:9, sRGB**, także dla materiałów z TikToka. Margines bezpieczeństwa 10% (192/108 px).
  Krótki nagłówek 3–6 słów (max 2 linie), pełny tytuł w HTML. Bez daty, logo platform i przycisków w obrazie. Bez kadrowania na stronie.
- Pionowe 1080×1920 tylko osobno, do użycia na platformach, nie z automatycznego kadru.
- Ten sam materiał na 2 platformach = 1 karta. Skrót vs pełna wersja = 2 karty („Skrót” / „Pełny materiał”), pole `related_id`.
- Codex przekazuje `content/okladki/<id>.png` + gotowy wpis JSON; Stefan scala, waliduje, testuje, publikuje po akceptacji Damiana.
- Schemat JSON + pola: `status` (draft/published), `format` (full/short), opcjonalnie `duration_seconds`, `related_id`.
  Walidacja: unikalne `id`, prawdziwa data, dozwolona kategoria, okładka 1920×1080, URL tylko https na youtube.com/youtu.be/tiktok.com
  do konkretnego filmu (nie profil, nie skracacz), `primary` wskazuje istniejący link.
- **Bez ikony play.** Etykieta „YouTube ↗”/„TikTok ↗”, okładka+tytuł = jeden link do `primary`, pod spodem osobne linki platform.
- SEO: bez `VideoObject` (Google wymaga osadzonego filmu, którego celowo nie ma); zwykły indeksowalny HTML, ewentualnie `ItemList`.
- Analityka: dalej jedno zdarzenie `platform_click`, rozszerzone o `material_id`, `category`, `placement` (hero/karta).
- Prawa: tylko własne/licencjonowane grafiki, bez wizerunków polityków i symboli partyjnych; ilustracja AI nie udaje zdjęcia dokumentalnego.

## Ustalenia (zaakceptowane przez Damiana 31.10.2026: „Tak, buduj”)

Wszystkie 12 punktów z czatu. Wdrożone w kodzie:
- dane: `content/materialy.json` + okładki `content/okladki/`, instrukcja przekazania: **`content/README.md`**;
- generowanie i walidacja: `scripts/materials.mjs` (plugin w `vite.config.js`), testy `scripts/test-materials.mjs`;
- wygląd: `src/styles/materials.css`; pomiar `platform_click` z `placement`, `material_id`, `category` (wymiary w GA4 dodane);
- pusta lista = strona wygląda jak dotąd (bez sekcji i bez strzałki).

Następny krok: Codex przygotowuje pierwszą okładkę + wpis według `content/README.md`.

## Przegląd Codexa po wdrożeniu (31.10.2026) – wszystkie 10 uwag zweryfikowane i poprawione

1. Typy i puste teksty (`title: 42`, `"   "`, element `null`) → komunikat walidacji zamiast wyjątku.
2. `category`/`format` z prototypu (`constructor`) → `Object.hasOwn` / `Set`.
3. `cover` ze ścieżką (`../`) → tylko sama nazwa pliku z `content/okladki/`.
4. Okładka: prawdziwy JPEG/PNG, sRGB, bez przezroczystości; uszkodzony plik = komunikat.
5. URL z loginem/hasłem/portem odrzucany.
6. `related_id` do siebie odrzucany; etykiety „Skrót” i „Pełny materiał”.
7. Stopka przeniesiona za `<main>`.
8. Etykiety na okładce `aria-hidden` (bez powtarzania platformy w czytniku).
9. Pomiar także dla `auxclick` (środkowy przycisk).
10. `sizes` dopasowane do siatki (395 px przy 3 kolumnach).
README: wolne rogi pod etykiety, `duration_seconds`, zasady `cover`. Testy: `test-materials` 35/35, funkcjonalne 26/26 (pusta lista) i 32/32 (przykład).

Szablon okładek `content/szablon-okladki/` (HTML/CSS + SVG, eksport Playwright 1920×1080): Codex chce go zrobić,
potrzebuje do tego prawa zapisu (`--zapis`) – czeka na słowo Damiana.
