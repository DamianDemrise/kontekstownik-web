# Import materiału ze Studio na stronę (kontrakt v1, 31.10.2026)

Studio (repo `ai-video-factory`) po **akceptacji Damiana** i publikacji na YouTube przekazuje paczkę; importer strony
dodaje albo uzupełnia kartę i podstronę `/materialy/<slug>/`. Bez odtwarzaczy i iframe. Tylko PL (EN później, ręcznie).

## Wywołanie (na Macu wykonawcy, w katalogu repo strony)
```bash
cd ~/Desktop/Projekty/kontekstownik-web
node scripts/import-material.mjs /ścieżka/paczka.json --dry-run --json   # walidacja, nic nie zapisuje
node scripts/import-material.mjs /ścieżka/paczka.json --publish --json   # zapis + commit + build + push = publikacja
```
Wynik (`--json`): `{"ok":true,"status":"created|updated|unchanged","id":"…","slug":"…","url":"https://www.kontekstownik.pl/materialy/…/","commit":"abc1234"}`
albo `{"ok":false,"error":"…"}` (kod wyjścia 2 = błąd danych, nic nie zapisano). Strona jest na żywo ok. 1 min po pushu
(GitHub Pages). `--commit` bez `--publish` = zapis i commit lokalnie, bez publikacji.

## Paczka `kontekstownik.material/1`
Wzór: `content/przyklad/paczka-studio.json`. Pola:

| Pole | Wymagane | Skąd w Studio | Zasada |
|---|---|---|---|
| `schema` | tak | stała | `"kontekstownik.material/1"` |
| `approved` | tak | akceptacja Damiana | musi być `true` – inaczej import odmówi |
| `id` | tak | Studio | stałe, `RRRR-MM-DD-temat` (małe litery, cyfry, myślniki) |
| `slug` | nie | Studio | adres podstrony; po pierwszym imporcie **nie zmienia się** (importer zachowuje stary) |
| `title`, `lead` | tak | pakiet publikacji | do 120 / 200 znaków |
| `category` | tak | Studio | 7 kategorii Studio 1:1: `polityka`, `gospodarka`, `wydarzenia`, `medycyna`, `katastrofy`, `motoryzacja`, `technologia` (wielkość liter bez znaczenia; aliasy EN: politics, economy, events, health, disasters, automotive, technology). `spoleczenstwo`/`swiat` przyjmowane dla zgodności starszych wpisów; Polska/Świat będzie osobnym podziałem geograficznym |
| `date` | tak | data publikacji filmu | `RRRR-MM-DD` |
| `as_of` | zalecane | data stanu informacji | `RRRR-MM-DD` |
| `youtube` | tak* | URL zwrócony przez API YouTube | adres konkretnego filmu (`watch?v=`, `shorts/`, `youtu.be/`) |
| `tiktok` | nie | URL filmu TikTok | `https://www.tiktok.com/@kontekstownik/video/<id>` |
| `primary` | nie | – | domyślnie `youtube` |
| `summary` | zalecane | opis YouTube bez hasztagów i linków | 1–8 akapitów |
| `key_points` | nie | scenariusz | 2–5 punktów do 160 znaków („W skrócie”) |
| `transcript` | zalecane | `scenario.txt` – tekst lektora per scena | 1–60 akapitów do 1500 znaków |
| `sources` | zalecane | `sources.md` | `[{ "title", "publisher", "url" }]`, tylko `https`, max 20 |
| `note` | zalecane | – | np. „Lektor i muzyka w filmie powstały przy użyciu AI.” |
| `series` | nie | Studio | wątek, np. `trybunal-konstytucyjny` – materiały z serii łączą się jako powiązane |
| `duration_seconds` | nie | MP4 | liczba całkowita |
| `cover_h` | tak** | okładka pozioma | ścieżka względem paczki; **1920×1080**, JPEG/PNG, sRGB, bez przezroczystości |

\* co najmniej jeden link do filmu. \** albo argument `--cover`. Okładka pionowa nie jest potrzebna stronie.

## Gwarancje importera
- **Idempotencja:** ponowienie tej samej paczki = `unchanged`, bez commita. Ten sam film YouTube pod innym `id` aktualizuje
  istniejący wpis (bez duplikatu, adres bez zmian). Wersja EN i powiązania istniejącego wpisu zostają.
- **Bezpieczeństwo zmian:** odmowa, gdy `content/materialy.json` albo plik okładki ma niezacommitowane zmiany; commit obejmuje
  wyłącznie te dwa pliki; blokada `.import.lock` przed równoległym uruchomieniem.
- **Walidacja przed zapisem:** cały plik materiałów sprawdzany na kopii (te same reguły co build strony).
- **Publikacja tylko z `--publish`** i tylko dla `approved: true`.
- Testy: `node scripts/test-import.mjs` (na tymczasowej kopii repo).
