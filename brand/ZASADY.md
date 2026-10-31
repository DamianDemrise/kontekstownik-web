# KONTEKSTOWNIK – zasady użycia logo (kierunek A · Kadr, 31.10.2026)

Znak: logotyp **KONTEKSTOWNIK** (Montserrat ExtraBold, litery zamienione na krzywe) w **kadrze** z dwóch pomarańczowych
narożników – lewy górny i prawy dolny. Idea: kontekst = to, co obejmuje temat.

## Pliki (`brand/`)
| Do czego | Plik |
|---|---|
| Strona, druk, prezentacje (wektor) | `svg/logo-kolor.svg` (na ciemne tło), `svg/logo-na-jasnym.svg`, `svg/logo-bialy.svg`, `svg/logo-czarny.svg` |
| Wersja pionowa | `svg/logo-pionowe-kolor.svg`, `svg/logo-pionowe-na-jasnym.svg` |
| Sygnet (sam znak K w kadrze) | `svg/sygnet-*.svg`, `png/sygnet-*-1024.png` |
| **Awatar YouTube / TikTok / Instagram / Facebook** | `png/awatar-800.png` (albo `awatar-2048.png`) – kwadrat, platforma sama przytnie do koła |
| Znak wodny w filmach | `png/znak-wodny-sygnet-bialy-400.png` (róg kadru) albo `png/znak-wodny-logo-bialy-1200.png`; krycie 60–80 % |
| Grafiki i miniatury | `png/logo-*-2400.png` (przezroczyste tło), `png/logo-na-ciemnym-tlo-2400x800.png` |
| Strona: favicon, ikony | `public/favicon.svg`, `favicon-16/32.png`, `apple-touch-icon.png`, `icons/icon-192/512.png` |

## Kolory
| | HEX | Użycie |
|---|---|---|
| Pomarańcz kadru | `#FF8A00` | wyłącznie narożniki i akcenty |
| Biel | `#F5F7FA` | litery na ciemnym tle |
| Atrament | `#0B1218` | litery na jasnym tle |
| Tło marki | `#080D12` | tło awatara i grafik |

## Pole ochronne i rozmiary
- Wokół logo zostaw wolne pole co najmniej **równe wysokości litery K** (z każdej strony, licząc od narożników).
- Logo poziome: najmniej **120 px** szerokości na ekranie / **30 mm** w druku. Mniej – użyj sygnetu.
- Sygnet: najmniej **24 px**. Poniżej (16–32 px) używaj `favicon.svg` – ma grubszy kadr i większą literę.

## Czego nie robić
- Nie zmieniaj kolorów narożników (zawsze pomarańcz albo jednolity kolor całego znaku: biały/czarny).
- Nie przestawiaj narożników (zawsze lewy górny + prawy dolny), nie dodawaj trzeciego i czwartego.
- Nie rozciągaj, nie pochylaj, nie dodawaj cieni, obrysów ani gradientów.
- Nie zmieniaj kroju liter, nie rozbijaj słowa na dwie linie (do tego jest wersja pionowa z sygnetem).
- Nie umieszczaj na zdjęciach bez podkładu, jeśli kontrast jest słaby.
- Neutralność: nie łącz znaku z symbolami, barwami ani hasłami partii politycznych.

## Źródło i regeneracja
`scripts/logo/build_logo.py` (geometria, krzywe) → `scripts/logo/build_assets.mjs` (PNG, favicony, ikony).
Zmiana proporcji kadru: stałe `T`, `GAP`, `ARM_H`, `ARM_V` na początku `build_logo.py`.
