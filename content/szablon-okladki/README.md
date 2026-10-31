# Szablon okładek

Własny HTML/CSS z czterema ilustracjami SVG osadzonymi w `szablon.html`.
1920×1080, tło #080D12, akcent #FF8A00, biel. Lokalne fonty Montserrat
z `public/fonts/`, zakresy Unicode zgodne z `src/styles/tokens.css`.
Nagłówek Montserrat 800, 3–6 słów, najwyżej dwie linie; kategoria Montserrat 600.
Ważne elementy mieszczą się w marginesie 10%. Oba górne rogi 300×130 px są puste.

## Eksport

Z katalogu głównego repozytorium, istniejące Node, Playwright, sharp i systemowy Chrome:

```bash
node content/szablon-okladki/eksport.mjs --id ustawa --naglowek "Jak powstaje nowa ustawa" --kategoria polityka --out content/szablon-okladki/probki
```

Odtworzenie pięciu próbek:

```bash
node content/szablon-okladki/eksport.mjs --json content/szablon-okladki/probki/dane.json --out content/szablon-okladki/probki
```

Bez `--out` skrypt zapisuje `content/okladki/<id>.jpg` względem katalogu projektu.
**W ramach zgody z 31.10.2026 używaj wyłącznie `--out content/szablon-okladki/probki`.**
Zapis do `content/okladki/` wymaga osobnej zgody Damiana.
Jawne ścieżki `--json` i `--out` są względem bieżącego katalogu terminala.
Istniejący plik o tym samym id zostaje nadpisany. Id: małe litery ASCII, cyfry i myślniki.
Opcja `--chrome` zmienia ścieżkę Chrome; `--help` wyświetla składnię.

JSON może zawierać jeden obiekt lub tablicę obiektów:

```json
{"id":"ustawa","nagłówek":"Jak powstaje nowa ustawa","kategoria":"polityka","motyw":"instytucje"}
```

Pole `naglowek` jest aliasem `nagłówek`; w CLI używaj `--naglowek` lub `--nagłówek`.
Nie łącz `--json` z polami pojedynczej okładki.

| Kategoria | Domyślny motyw | Ilustracja |
|---|---|---|
| polityka | instytucje | schemat budynku instytucji |
| gospodarka | obieg | dokument i obieg, bez wykresu danych |
| spoleczenstwo | relacje | abstrakcyjne połączenia |
| swiat | globus | siatka globu, bez flag i granic |

Opcjonalne `--motyw` wybiera dowolny z czterech motywów niezależnie od kategorii.
Ilustracje są schematyczne i nie przedstawiają pomiarów ani wydarzeń.

## Walidacja i ograniczenia

Eksporter osadza lokalne fonty bez dostępu do sieci i czeka na `document.fonts.ready`.
Przed zapisem zestawu kontroluje wszystkie nagłówki w Chrome: trzy do sześciu słów,
najwyżej dwie linie i brak poziomego wyjścia poza obszar tekstu.
Zbyt długi tekst kończy eksport błędem; font nie jest automatycznie zmniejszany.
Pliki JPEG mają profil ICC sRGB, dokładnie 1920×1080 i nie mają kanału alfa.
W razie błędu dysku podczas zapisu część zestawu może już istnieć.

`szablon.html` można otworzyć lokalnie, by zobaczyć domyślny wariant.
Pliki fontów i arkusz CSS muszą pozostać w obecnym układzie katalogów.
To szablon poziomy; nie generuje pionowych okładek, wpisów w `materialy.json`,
dat, logo platform, przycisków ani ikony play. Próbki nie są materiałami do publikacji.

## Stan weryfikacji w tej sesji

Sprawdzono składnię eksportera i odrzucanie niepoprawnych argumentów.
`probki/dane.json` zawiera pięć zestawów wejściowych, w tym „Zażółć gęślą jaźń”.
Eksport obrazów jest zablokowany: systemowy Chrome 156 kończy proces kodem 134
również przy minimalnym uruchomieniu headless w obecnym środowisku wykonawczym.
Nie powstały jeszcze próbki JPEG. Układ, pomiar dwóch linii i finalny obraz wymagają
uruchomienia powyższej komendy w środowisku, w którym Chrome działa.
