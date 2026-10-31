#!/bin/sh
# Kontrola publicznej strony po wdrożeniu: DNS, SSL, przekierowania, treść, zasoby, linki platform.
# Działa dla GitHub Pages i dla hostingu LH.pl.
set -u
D=kontekstownik.pl; W=www.$D; FAIL=0
ok() { echo "ok   $1"; }; bad() { echo "FAIL $1"; FAIL=1; }
code() { curl -s -o /dev/null -w '%{http_code} %{redirect_url}' -m 15 "$1"; }

[ -n "$(dig +short $D A)" ] && ok "DNS $D -> $(dig +short $D A | tr '\n' ' ')" || bad "DNS $D brak rekordu A"
[ -n "$(dig +short $W A)" ] && ok "DNS $W -> $(dig +short $W A | tr '\n' ' ')" || bad "DNS $W brak rekordu A"
for h in $D $W; do
  exp=$(echo | openssl s_client -servername $h -connect $h:443 2>/dev/null | openssl x509 -noout -enddate 2>/dev/null)
  [ -n "$exp" ] && ok "SSL $h ($exp)" || bad "SSL $h brak/niepoprawny certyfikat"
done
for u in http://$D/ http://$W/ https://$D/; do
  r=$(code "$u"); case "$r" in "301 https://$W/") ok "$u -> 301 https://$W/";; *) bad "$u -> $r (oczekiwane 301 https://$W/)";; esac
done
r=$(code https://$W/); [ "${r%% *}" = 200 ] && ok "https://$W/ 200" || bad "https://$W/ -> $r"
html=$(curl -s -m 15 https://$W/)
echo "$html" | grep -q 'href="https://www.youtube.com/@kontekstowniktv"' && ok "link YouTube w HTML" || bad "brak linku YouTube"
echo "$html" | grep -q 'href="https://www.tiktok.com/@kontekstownik"' && ok "link TikTok w HTML" || bad "brak linku TikTok"
for a in $(echo "$html" | grep -oE '(href|src)="/[^"]+"' | sed -E 's/^[a-z]+="//; s/"$//' | sort -u) /og-image.jpg /robots.txt /sitemap.xml; do
  c=$(curl -s -o /dev/null -w '%{http_code}' -m 15 "https://$W$a"); [ "$c" = 200 ] && ok "zasób $a" || bad "zasób $a -> $c"
done
r=$(code https://$W/nie-istnieje); [ "${r%% *}" = 404 ] && ok "404 dla nieistniejącej strony" || bad "nieistniejąca strona -> $r"
exit $FAIL
