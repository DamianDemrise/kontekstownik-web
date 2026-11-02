# Strony kanałów: Kontekstownik, Kids i Influ

Zmiana Damiana z 2.11.2026: jedna witryna z przełącznikiem marek u góry. Wcześniejszy plan bez strony Influ został zastąpiony tą decyzją.

- `/` i `/en/`: dotychczasowa strona i materiały; dodany nagłówek kanałów.
- `/kids/`: oryginalne logo Kids, turkus/żółć, kanały YouTube/Instagram/Facebook oraz 4 opublikowane filmy serii „Gry, bajki i internet”. TikTok Kids nie jest podlinkowany.
- `/influ/`: logo Influ, ciemna oprawa różowo-niebieska, kanały YouTube/TikTok/Instagram i jedna karta Andziaks, z linkami wszystkich trzech potwierdzonych publikacji.

## Moduły

`scripts/brands.mjs` zawiera jawny rejestr kanałów, statyczny nagłówek i renderowanie dwóch landingów. `vite.config.js` generuje źródłowe HTML przed buildem, dodaje wejścia Vite i adresy do sitemap. Katalogi `/kids/` i `/influ/` są generowane i ignorowane w Git. Nie edytuj ich ręcznie.

`src/styles/brands.css` izoluje wygląd nowych marek. Główna treść i `content/materialy.json` nie są zmieniane; dotychczasowy importer materiałów nadal działa tak samo.

`public/brands/` zawiera kopie istniejących zatwierdzonych logotypów i okładek. Logo Kids pozostaje niezmienione. Okładki pionowe są wyświetlane w pełnych proporcjach, bez kadrowania.

## Źródła wpisów

- Kids: `PUBLIKACJE_SERIA_03.json` w lokalnych wynikach Kids; cztery wpisy ze stanem `published-public-profile-verified` dla Instagramu, 1.11.2026.
- Influ: zatwierdzony pilot Andziaks, 2.11.2026; publikacje sprawdzone w Chrome przez głównego Codexa: YT `rtMQjyIiy5M`, IG `DfPX0XItP7Z`, TT `7703563013369957654`.

To jawne, statyczne prezentacje potwierdzonych publikacji. Integracja automatycznego dostarczania materiałów Kids/Influ ze Studio to osobny etap; nie dodano domniemanego mapowania ani nie zmieniono formatu danych obecnego importera. Nie dodawaj niezweryfikowanych linków. Materiał na kilku platformach nadal ma jedną kartę.

## Sprawdzenie

`npm run build` → `npm run preview` → `npm test`. Dodatkowy `node scripts/test-brands.mjs` sprawdza gotowe adresy, rozdzielenie marek, potwierdzone filmy, brak odtwarzaczy oraz sitemap. Podglądy obu marek i głównego nagłówka: `docs/screenshots/brands-*.png`.

Push na `main` publikuje stronę. Ta gałąź nie została wypchnięta ani wdrożona; integrację wykonuje główny Codex po przeglądzie.
