# Materiały wideo: jak dodać nowy (dla Codexa i Stefana)

Strona **nie odtwarza** filmów. Każdy materiał ma kartę na stronie głównej i własną podstronę `/materialy/<slug>/`
(opis, źródła, stan informacji, przyciski YouTube / TikTok, własny podgląd linku). Build generuje też `sitemap.xml`.

## Co przekazuje Codex

1. **Okładkę**: `content/okladki/<id>.jpg` (albo `.png`) – najprościej z szablonu `content/szablon-okladki/` (instrukcja w jego README):
   `node content/szablon-okladki/eksport.mjs --id <id> --naglowek "3–6 słów" --kategoria polityka`
   - dokładnie **1920×1080 px**, 16:9, sRGB, bez przezroczystości;
   - margines bezpieczeństwa 10%: ważne elementy w prostokącie 192–1728 × 108–972 px;
   - krótki nagłówek 3–6 słów (max 2 linie), Montserrat 800, kolory marki (#080D12, #FF8A00, biel);
   - bez daty, logo platform, przycisków i ikony play (strona nie odtwarza filmów, platformę pokazuje etykieta HTML);
   - zostaw wolne rogi: prawy górny ok. 300×130 px zasłania etykieta platformy („YouTube ↗”), lewy górny ok. 300×130 px etykieta „Skrót”/„Pełny materiał”;
   - tylko własne/licencjonowane grafiki; bez wizerunków polityków, flag, symboli partyjnych;
     ilustracja AI nie może udawać zdjęcia dokumentalnego, a wykres nie może udawać prawdziwych danych.
2. **Wpis** (obiekt JSON) do `content/materialy.json`:

```json
{
  "id": "2026-11-03-inflacja-pazdziernik",
  "status": "published",
  "title": "Inflacja w październiku. Co naprawdę podrożało?",
  "lead": "Skąd wzrost cen i których wydatków dotyczy najbardziej.",
  "category": "gospodarka",
  "date": "2026-11-03",
  "format": "full",
  "cover": "2026-11-03-inflacja-pazdziernik.jpg",
  "cover_alt": "",
  "youtube": "https://www.youtube.com/watch?v=XXXXXXXXXXX",
  "tiktok": "https://www.tiktok.com/@kontekstownik/video/1234567890123456789",
  "primary": "youtube"
}
```

| Pole | Zasada |
|---|---|
| `id` | trwały, małe litery/cyfry/myślniki, najlepiej `RRRR-MM-DD-temat`; nie zmieniać po publikacji |
| `status` | `published` (na stronie) albo `draft` (pomijany) |
| `title` | pełny tytuł, max 120 znaków |
| `lead` | jedno zdanie, max 200 znaków, dopowiada coś do tytułu |
| `category` | `polityka`, `gospodarka`, `spoleczenstwo`, `swiat` |
| `date` | data publikacji filmu (nie dodania karty), `RRRR-MM-DD` |
| `format` | `full` (domyślnie) albo `short` – etykieta „Skrót”; pełna wersja z `related_id` dostaje „Pełny materiał” |
| `duration_seconds` | opcjonalnie, długość filmu w sekundach (liczba całkowita); dziś tylko informacyjnie |
| `cover` | sama nazwa pliku z `content/okladki/` (bez ścieżki), JPEG albo PNG, sRGB, bez przezroczystości |
| `cover_alt` | zwykle `""` (tytuł jest obok); opis tylko, gdy obraz niesie informację |
| `youtube` / `tiktok` | adres **konkretnego filmu** (https): `youtube.com/watch?v=…`, `youtube.com/shorts/…`, `youtu.be/…`, `www.tiktok.com/@konto/video/…`; min. jeden |
| `primary` | platforma, na którą prowadzi klik w okładkę/tytuł |
| `related_id` | opcjonalnie: skrót ↔ pełna wersja (osobne karty) |
| `slug` | adres podstrony `kontekstownik.pl/materialy/<slug>/`; domyślnie `id` bez daty. **Nie zmieniać po publikacji** (linki i Google) |
| `summary` | 1–8 akapitów opisu na podstronę (np. opis z YouTube bez hasztagów i linków) |
| `sources` | lista źródeł `{ "title": "…", "url": "https://…" }` – pokazywane na podstronie, wzmacniają wiarygodność |
| `as_of` | „Stan informacji” `RRRR-MM-DD` |
| `note` | krótka nota, np. „Lektor i muzyka w filmie powstały przy użyciu AI.” |
| `timeline` | oś czasu „Jak do tego doszło”: 2–15 pozycji `{ "date": "RRRR" / "RRRR-MM" / "RRRR-MM-DD", "text": "jedno zdanie", "source": "https://…" }`. **Tylko zweryfikowane fakty**, najlepiej każdy ze źródłem |
| `en` | wersja angielska `{ slug, title, lead, summary, note, timeline }` (`timeline` = lista przetłumaczonych zdań w tej samej kolejności) – bez niej materiał nie pojawia się na `/en/`; `slug` po angielsku (adres `/en/materials/<slug>/`) |

Ten sam film na obu platformach = **jedna karta** z dwoma linkami. Skrót (TikTok) i pełny materiał (YouTube) = **dwie karty** z `related_id`.

## Co robi Stefan

```bash
npm run materialy:check   # walidacja danych i okładek
npm run build && npm run preview
npm test && node scripts/test-materials.mjs
```
Potem podgląd dla Damiana i publikacja (`git push` na `main`) **dopiero po jego akceptacji**.
Build sam robi z okładki WebP 480/960/1440 i kartę w HTML; szkice nie trafiają na stronę.

Przykładowe dane do testów i podglądu: `content/przyklad/` (`npm run build:przyklad`). Nie publikować.
