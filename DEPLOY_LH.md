# Wdrożenie: GitHub Pages + DNS w LH.pl

## Jak to działa (od 31.10.2026, tak samo jak dobrolinski.pl)

- **Pliki strony:** GitHub Pages, repo `DamianDemrise/kontekstownik-web` (publiczne), bez kosztów.
  Każdy push na `main` uruchamia `.github/workflows/deploy.yml`: `npm ci` → `npm run build` → publikacja `dist/`.
- **Domena i DNS:** LH.pl, konto `damiandobrolinski`, sposób zarządzania „Zaparkowana w LH.pl”.
  Serwer WWW w LH.pl **nie jest potrzebny**.
- **Adres główny:** `https://www.kontekstownik.pl/` (CNAME w Pages + `public/CNAME`). `kontekstownik.pl` → 301 na www robi GitHub (z `http://kontekstownik.pl` dwa skoki: http://www, potem https).
- **SSL:** certyfikat Let's Encrypt wystawia GitHub automatycznie, „Enforce HTTPS” włączone.

### Rekordy DNS (Panel LH.pl → Domeny → kontekstownik.pl → Edytuj rekordy DNS)

| Typ | Host | Wartość |
|---|---|---|
| A | kontekstownik.pl | 185.199.108.153 |
| A | kontekstownik.pl | 185.199.109.153 |
| A | kontekstownik.pl | 185.199.110.153 |
| A | kontekstownik.pl | 185.199.111.153 |
| CNAME | www.kontekstownik.pl | damiandemrise.github.io. |

Pozostałe rekordy (autoconfig, SRV autodiscover, TXT SPF) to domyślne rekordy poczty LH.pl, zostawione bez zmian.

### Publikacja zmian

```bash
npm run build && npm run preview   # lokalnie, w drugim terminalu: npm test
git push                           # GitHub zbuduje i opublikuje w ~1 min
./scripts/verify-live.sh           # kontrola publicznej strony
```

### Ograniczenia GitHub Pages

- `public/.htaccess` jest ignorowany (to nie Apache). Przekierowania i HTTPS robi GitHub; własnych nagłówków
  (CSP, cache) ustawić się nie da. Plik zostaje na wypadek przeniesienia na hosting LH.pl (sekcja niżej).
- Repo musi być publiczne (darmowy plan). Nie trzymać w nim żadnych danych dostępowych.

---

# Wariant alternatywny: hosting WWW w LH.pl (FTP)

Używać tylko, jeśli strona ma się przenieść na serwer LH.pl. Wtedy rekordy A/CNAME powyżej trzeba zastąpić
przypisaniem domeny do serwera.

## Krok po kroku

### 1. Hosting
Panel https://www.lh.pl/panel → **Serwery**. Jeśli jest aktywny serwer (Hosting WWW), użyj go. Jeśli nie ma żadnego,
strona wymaga hostingu: to decyzja zakupowa, nie robimy jej bez zgody.

### 2. Domena → katalog
**Serwery → [serwer] → Strony WWW → Dodaj → domena** `kontekstownik.pl`. Panel zasugeruje katalog nazwany jak domena:
zostaw go, to izoluje stronę od innych. Dodaj też `www.kontekstownik.pl` (alias/ta sama strona), jeśli panel nie zrobi tego sam.
**Zapisz dokładną ścieżkę katalogu**: idzie do `LH_REMOTE_DIR` w `deploy.env`.

### 3. DNS i SSL
- Poczekaj, aż `dig +short kontekstownik.pl A` i `dig +short www.kontekstownik.pl A` zwrócą IP serwera.
- **Strony WWW → [strona] → Opcje → Włącz SSL → Let's Encrypt → Włącz**
  (https://www.lh.pl/pomoc/doc/jak-uruchomic-certyfikat-ssl-lets-encrypt-na-serwerze-w-lh-pl/).
  Warunek: rekordy A obu wersji (z www i bez) wskazują serwer. Certyfikat musi objąć **obie** nazwy.

### 4. Dostęp FTP/SFTP (bezpiecznie)
Dane (host, login, hasło) są w mailu aktywacyjnym serwera / panelu LH.pl.
```bash
cp deploy.env.example deploy.env       # uzupełnij LH_HOST, LH_USER, LH_REMOTE_DIR, LH_PROTO
security add-generic-password -s kontekstownik-lh-ftp -a <login> -w   # hasło wpisujesz interaktywnie
```
Hasło nie trafia do repo, `deploy.env` ani logów. `LH_PROTO=sftp`, jeśli pakiet ma SSH, w przeciwnym razie `ftp`
(skrypt wymusza FTPS z weryfikacją certyfikatu).

### 5. Build i kontrole lokalne
```bash
npm run build && npm run preview     # w drugim terminalu: npm test
```

### 6. Podgląd wdrożenia (bez zmian na serwerze)
```bash
./scripts/deploy-lh.sh
```
Sprawdza dostęp i katalog, **pobiera kopię** całego zdalnego katalogu do `backups/<data>/`, pokazuje listę zmian.
Jeśli katalog zawiera pliki innej strony, przerwij i wyjaśnij, czyje są.

### 7. Wysyłka
```bash
./scripts/deploy-lh.sh --wyslij
```
Wysyła `dist/` (z `.htaccess`). Niczego na serwerze nie kasuje. Domyślny `index.html` od LH.pl zostaje nadpisany.

### 8. Kontrola publiczna
```bash
./scripts/verify-live.sh
```
DNS, certyfikaty obu nazw, `http://` i bez `www` → `301 https://www.kontekstownik.pl/`, 200, linki platform,
wszystkie zasoby, strona 404, nagłówki z `.htaccess`. Do tego ręcznie na telefonie: oba przyciski otwierają aplikacje.

### 9. Po potwierdzeniu SSL
Odkomentuj HSTS w `public/.htaccess`, przebuduj, wyślij ponownie. Zgłoś stronę w Google Search Console
(właściwość domeny, weryfikacja rekordem TXT w DNS LH.pl) i dodaj `sitemap.xml`.

## Przekierowania (`public/.htaccess`)

1. `http://` → `https://www.kontekstownik.pl/…` (reguła z pomocy LH.pl `%{HTTPS} !=on`, dodatkowo
   respektuje `X-Forwarded-Proto: https`, żeby nie zapętlić się za proxy);
2. `https://kontekstownik.pl` → `https://www.kontekstownik.pl`;
3. `/index.html` → `/`.

Jedno przekierowanie na żądanie, bez łańcuchów. Jeśli po wdrożeniu `verify-live.sh` pokaże pętlę lub brak przekierowania,
sprawdź, czy LH.pl nie ma włączonego własnego wymuszania HTTPS w panelu (wtedy zostaw tylko regułę 2).

## Wycofanie

Kopia sprzed wdrożenia jest w `backups/<data>/`. Przywrócenie: wgraj ją tym samym `lftp mirror -R` do `LH_REMOTE_DIR`.
