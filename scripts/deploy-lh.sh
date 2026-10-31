#!/bin/sh
# Publikacja dist/ na hosting LH.pl przez FTPS/SFTP (lftp).
#   ./scripts/deploy-lh.sh            podgląd: sprawdza dostęp, robi kopię zdalnego katalogu, pokazuje co zostanie wysłane
#   ./scripts/deploy-lh.sh --wyslij   to samo + faktyczne wysłanie plików
# Nic nie jest kasowane na serwerze (bez --delete). Hasło z pęku kluczy, przekazywane przez zmienną środowiskową
# (lftp --env-password), więc nie ląduje w argumentach procesu ani w logach.
set -eu
cd "$(dirname "$0")/.."
[ -f deploy.env ] || { echo "Brak deploy.env (wzór: deploy.env.example)"; exit 1; }
. ./deploy.env
SEND=0; [ "${1:-}" = "--wyslij" ] && SEND=1

[ -f dist/index.html ] || { echo "Brak dist/. Uruchom: npm run build"; exit 1; }
node scripts/check-dist.mjs >/dev/null || { echo "check-dist nie przeszedł"; exit 1; }

LFTP_PASSWORD=$(security find-generic-password -s "$LH_KEYCHAIN_SERVICE" -a "$LH_USER" -w 2>/dev/null) || {
  echo "Brak hasła w pęku kluczy (usługa $LH_KEYCHAIN_SERVICE, konto $LH_USER). Zobacz DEPLOY_LH.md."; exit 1; }
export LFTP_PASSWORD

SETTINGS="set cmd:fail-exit yes; set net:max-retries 2; set net:timeout 20; set ssl:verify-certificate yes"
[ "$LH_PROTO" = "ftp" ] && SETTINGS="$SETTINGS; set ftp:ssl-force yes; set ftp:ssl-protect-data yes"
lf() { lftp --env-password -u "$LH_USER" -e "$SETTINGS; $1; bye" "$LH_PROTO://$LH_HOST"; }

echo "1/4 Dostęp i katalog docelowy: $LH_REMOTE_DIR"
lf "cls -la $LH_REMOTE_DIR" || { echo "Nie widzę katalogu $LH_REMOTE_DIR. Sprawdź przypisanie domeny w panelu."; exit 1; }

STAMP=$(date +%Y%m%d-%H%M%S)
echo "2/4 Kopia zdalnego katalogu -> backups/$STAMP"
mkdir -p "backups/$STAMP"
lf "mirror --parallel=3 $LH_REMOTE_DIR backups/$STAMP"

echo "3/4 Różnice (dist -> serwer):"
lf "mirror -R --dry-run --no-perms --parallel=3 dist $LH_REMOTE_DIR"

if [ $SEND -eq 0 ]; then echo "Podgląd zakończony. Wysyłka: ./scripts/deploy-lh.sh --wyslij"; exit 0; fi
echo "4/4 Wysyłka"
lf "mirror -R --no-perms --parallel=3 --verbose=1 dist $LH_REMOTE_DIR"
echo "Wysłano. Kontrola: ./scripts/verify-live.sh"
