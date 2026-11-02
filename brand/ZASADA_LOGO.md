# ZASADA LOGO — Kontekstownik, Kontekstownik Kids, Kontekstownik Influ

Obowiązuje od akceptacji Damiana (2.11.2026). **Zastępuje** `outputs/ZASADA_LOGO.txt` z 1.11.2026 (Kids: „ten sam plik LOGO_KIDS.png”) — od teraz wzorcem są pliki z tego repo, nie `LOGO_KIDS.png`.

## 1. Jeden znak, trzy marki
- Znak = słowo KONTEKSTOWNIK (logo poziome) albo litera K (sygnet) w **kadrze z dwóch narożników**: A lewy-górny, B prawy-dolny.
- Krój: Montserrat ExtraBold, zamieniony na kontury. Geometria (H = wysokość wersalika): kreska 0,15 H, ramię 0,72 H, odstęp od liter 0,24 H, zewnętrzny promień ½ kreski. Jedno źródło: `brand.config.json`.
- Marki różnią się **tylko** kolorami narożników i dopiskiem:

| Marka | A (na ciemnym / jasnym) | B (na ciemnym / jasnym) | Dopisek |
|---|---|---|---|
| Kontekstownik | #FF8A00 / #B85400 | #FF8A00 / #B85400 | — |
| Kids | #FFE035 / #9C7300 | #04A8AD / #047F84 | KIDS |
| Influ | #E2408A / #C21F68 | #7C86F2 / #4F5BD5 | INFLU |

- Dopisek: pole w kolorze A, litery w kolorze tła; w logo poziomym — wewnątrz kadru, za słowem, wysokość = H; w awatarze — pod K, ta sama skala dla Kids i Influ.

## 2. Pliki — tylko z `dist/`, nigdy z ręki
- Logo: `dist/<marka>/logo/logo-poziome-{dark,light,mono-light,mono-dark}.svg` (+ PNG 1024/512/192 w `png/`).
- Sygnet: `sygnet-*.svg`, kafel `sygnet-kafel.svg`, favicon `favicon/`.
- Awatar platform: `awatar/awatar-{youtube,instagram,tiktok,facebook}-*.png` (kwadrat, treść bezpieczna w kole).
- `dark` = na ciemne tło, `light` = na jasne. Na zdjęciu: `dark` + ciemny scrim pod logo (jak w szablonach okładek).
- Każda okładka/miniatura: logo ze swojego szablonu (`scripts/build-covers.mjs`) — stała pozycja i wysokość.

## 3. Pole ochronne
Wokół zewnętrznych krawędzi kadru wolne pole = **długość ramienia narożnika (0,72 H)**. Nic (tekst, krawędź kadru zdjęcia, UI) nie wchodzi w to pole.

## 4. Minimalne rozmiary
| Wersja | Ekran | Druk |
|---|---|---|
| Logo poziome | 20 px wysokości kadru | 6 mm |
| Logo poziome z dopiskiem | 24 px | 7 mm |
| Sygnet | 16 px (favicon) | 5 mm |
| Awatar z dopiskiem | dopisek czytelny od 48 px; przy 32 px rozpoznawalność daje kolor narożników | — |

Poniżej tych rozmiarów: sygnet bez dopisku (favicon), nie logo poziome.

## 5. Zakazy
- Nie przerysowywać, nie składać logo z fontu „na oko”, nie generować go AI, nie obrysowywać PNG.
- Nie zmieniać proporcji, nie rozciągać, nie obracać, nie pochylać, nie dodawać cieni, poświat, 3D, gradientów (również „instagramowego” w Influ).
- Nie zmieniać kolorów poza tabelą; nie zamieniać A i B; nie używać koloru innej marki.
- Nie przestawiać narożników (tylko A lewy-górny i B prawy-dolny), nie dokładać pozostałych dwóch.
- Nie używać jasnego wariantu na ciemnym tle i odwrotnie; na zdjęciu bez scrimu — nie.
- Nie zmieniać kroju, wielkości ani pozycji dopisku; nie tworzyć nowych dopisków bez decyzji Damiana.
- Starych plików (`LOGO_KIDS.png`, `logo-influ-ciemne.svg`, `logo-kadr.svg`) nie używać w nowych materiałach.

## 6. Głos marki na okładkach (2.11, decyzja Damiana: Influ krzykliwiej)
Ten sam układ i pozycja logo we wszystkich markach; różni się tylko natężenie (`voice` w `brand.config.json`):
- **main, Kids — spokojnie:** wyróżnienie w tytule kolorem A, kicker tekstem w kolorze B.
- **Influ — głośno:** wyróżnienie w polu koloru A z literami ink (jak dopisek INFLU), kicker w polu koloru B, tytuł +12%, mocniejsze nasycenie zdjęcia, narożniki kadru ×1,45. Bez gradientów, cieni i przechyleń — głośność tylko z pól koloru i skali.
Formaty: okładka filmu 1080×1920 (TikTok/Reels/Shorts), post 1080×1350 (FB/IG), miniatura YouTube 1280×720. Okładka Facebooka dla wszystkich trzech marek (Influ od 2.11 — nowa strona FB, z postem powitalnym 4:5).

## 7. Zdjęcia na okładkach
Tylko z rejestrem licencji (`LICENSES.md`): domena publiczna (NASA itp.), CC0, CC BY; CC BY-SA tylko świadomie (share-alike obejmuje okładkę). Podpis autora na grafice. Bez obrazów AI, bez wizerunku osób bez praw.
