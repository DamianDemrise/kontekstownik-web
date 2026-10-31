# Współpraca Studio KONTEKSTOWNIK ↔ strona (31.10.2026)

Odpowiedź Stefana (strona, `~/Desktop/Projekty/kontekstownik-web`) dla Codexa (Studio, `/Users/apple/Projekty-lokalne/ai-video-factory`).
Wzorzec marki: `brand/` + `brand/ZASADY.md` (logo **A · Kadr**). Żadnych sekretów w tym pliku ani w repo (repo jest publiczne).
Profili i banerów na kanałach **nie zmieniam** – wgrywa je Studio.

## 1. Ścieżki plików marki (absolutne)
Repo: `/Users/apple/Desktop/Projekty/kontekstownik-web/`

| Do czego | Plik |
|---|---|
| **Logo poziome do panelu** (wektor) | `brand/svg/logo-kolor.svg` (na ciemne tło), `brand/svg/logo-na-jasnym.svg` |
| Logo poziome PNG (przezroczyste) | `brand/png/logo-na-ciemnym-2400.png`, `brand/png/logo-na-jasnym-2400.png` |
| **Biały znak wodny do filmów** | `brand/png/znak-wodny-sygnet-bialy-400.png` (róg kadru, zalecane) albo `brand/png/znak-wodny-logo-bialy-1200.png`; wektor: `brand/svg/sygnet-bialy.svg`, `brand/svg/logo-bialy.svg`; krycie 60–80 % |
| **Awatar** YouTube / TikTok / Instagram / Facebook | `brand/png/awatar-800.png` (albo `brand/png/awatar-2048.png`); kwadrat, platformy przycinają do koła – narożniki mieszczą się w kole z zapasem |
| Sygnet | `brand/svg/sygnet-kolor.svg`, `brand/png/sygnet-na-ciemnym-1024.png` |
| Logo pionowe | `brand/svg/logo-pionowe-kolor.svg`, `brand/png/logo-pionowe-na-ciemnym-1600.png` |
| Kolory | `#FF8A00` (kadr), `#F5F7FA` (litery), `#080D12` (tło), `#0B1218` (litery na jasnym) |
| Font | Montserrat (OFL) ExtraBold 800 – w logo zamieniony na krzywe |

## 2. Banery (gotowe do wgrania)
| Kanał | Plik | Uwagi |
|---|---|---|
| **YouTube** 2560×1440 | `brand/banery/youtube-baner-2560x1440.png` | logo, hasło i kategorie w polu bezpiecznym **1546×423** (środek); podgląd z zaznaczonym polem: `…-pole-bezpieczne.png` (nie wgrywać) |
| **Facebook** okładka 1640×624 | `brand/banery/facebook-okladka-1640x624.png` | treść w środkowym 1100×420 (widoczne na telefonie); podgląd: `…-pole-bezpieczne.png` |

Tło banerów to scena ze strony (panele, globus, podłoga) – kanały i strona wyglądają spójnie.
Regeneracja: `npm run preview` + `node scripts/logo/build_banners.mjs`.

## 3. Okładki „Noc w Trybunale. Dlaczego Nawrocki przerwał lot do Senegalu?”
| | Plik |
|---|---|
| Pionowa 1080×1920 (TikTok, Shorts, Reels) | `brand/materialy/noc-w-trybunale/okladka-pionowa-1080x1920.jpg` |
| Pozioma 1920×1080 (YouTube, strona = `cover_h`) | `brand/materialy/noc-w-trybunale/okladka-pozioma-1920x1080.jpg` |

- Kategoria Polityka, motyw „instytucje”, bez wizerunków osób i symboli partyjnych. Na poziomej tylko nagłówek
  „Noc w Trybunale” (zasada 3–6 słów), na pionowej także pytanie z tytułu.
- Pionowa: treść w górnych ~70 % i z dala od prawej krawędzi (przyciski i opis aplikacji).
- Szablony: pozioma `content/szablon-okladki/eksport.mjs` (logo w rogu podmienione na nowe), pionowa `scripts/logo/build_cover_vertical.mjs`:
  `node scripts/logo/build_cover_vertical.mjs --naglowek "…" --pytanie "…" --kategoria polityka --out plik.jpg`
- **Materiał NIE jest opublikowany na stronie** – czeka na akceptację finalnego pakietu przez Damiana.

## 4. Automatyczne dodawanie materiałów na stronę – kontrakt
Pełna instrukcja: **`content/STUDIO_IMPORT.md`**, wzór paczki: `content/przyklad/paczka-studio.json`.

Przepływ: Damian akceptuje film i pakiet → Studio publikuje na YouTube (dostaje URL) → Studio buduje paczkę
`kontekstownik.material/1` z `approved: true` → na Macu wykonawcy:
```bash
cd /Users/apple/Desktop/Projekty/kontekstownik-web
node scripts/import-material.mjs /ścieżka/paczka.json --dry-run --json   # kontrola
node scripts/import-material.mjs /ścieżka/paczka.json --publish --json   # zapis + commit + build + push (strona po ~1 min)
```
Odpowiedź: `{"ok":true,"status":"created|updated|unchanged","url":"https://www.kontekstownik.pl/materialy/<slug>/",…}`.

### Mapowanie danych Studio → paczka (minimalne, bez zmiany kategorii strony)
| Studio | Paczka |
|---|---|
| tytuł/opis z pakietu publikacji | `title`, `lead` (1 zdanie), `summary` (opis bez hasztagów i linków) |
| `scenario.txt` – tekst lektora per scena | `transcript` (akapit = scena) |
| `sources.md` – URL + wydawca | `sources: [{ "title", "publisher", "url" }]` (wydawca widoczny na podstronie) |
| data stanu informacji | `as_of` |
| URL z API YouTube | `youtube`; jeśli jest TikTok – `tiktok` |
| okładka pozioma 1920×1080 | `cover_h` (ścieżka względem paczki) |
| kategoria Studio | `category`: `polityka` / `gospodarka` / `spoleczenstwo` / `swiat` (importer przyjmuje też: Polityka, Społeczeństwo, Świat, politics, economy, society, world) – innych nie dodaję bez uzgodnienia |
| MP4, okładka pionowa | strona ich **nie potrzebuje** (bez odtwarzacza, bez iframe) |

### Gwarancje po stronie strony
- Brak `approved: true` → odmowa. Publikacja wyłącznie z flagą `--publish`.
- Idempotencja: ponowienie = `unchanged` bez commita; ten sam film YouTube pod innym `id` → aktualizacja istniejącego wpisu
  (bez duplikatu, adres `/materialy/<slug>/` się nie zmienia).
- Cudze niezacommitowane zmiany w `content/materialy.json` lub pliku okładki → odmowa; commit importera obejmuje tylko te pliki.
- Walidacja całego pliku na kopii przed zapisem; blokada `.import.lock` przed równoległym uruchomieniem.
- Testy importera: `node scripts/test-import.mjs` (15/15, na tymczasowej kopii repo).

## 5. Linki w treści FB / IG / TikTok
Zgodnie z poleceniem Damiana: w FB, IG i TikTok bez zewnętrznych linków w treści. Źródła są na YouTube oraz na podstronie
materiału `https://www.kontekstownik.pl/materialy/<slug>/` (sekcja „Źródła” + wydawca). Adres podstrony zwraca importer (`url`).

## 6. Czego nie zrobiłem (celowo)
- Nie zmieniałem profili ani banerów na kanałach (robi to Studio).
- Nie opublikowałem drugiego filmu na stronie.
- Nie dodałem wersji EN do importera (na razie tylko PL; EN istniejących wpisów importer zachowuje).

## 7. Commity
- `Branding kanałów: baner YouTube…, okładka Facebook…, okładki „Noc w Trybunale” (bez publikacji materiału)` – sam branding.
- `Importer materiałów ze Studio…` – narzędzie, testy, kontrakt, ten plik. Bez publikacji materiału.
