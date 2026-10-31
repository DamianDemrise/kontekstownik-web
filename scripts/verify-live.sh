#!/bin/sh
# Kontrola publicznej strony po wdrożeniu: DNS, SSL, przekierowania, treść, zasoby, linki platform.
# Działa dla GitHub Pages i dla hostingu LH.pl.
set -u
D=kontekstownik.pl; W=www.$D; FAIL=0
ok() { echo "ok   $1"; }; bad() { echo "FAIL $1"; FAIL=1; }
# Adresy bierzemy z publicznego DNS (dig), nie z pamięci podręcznej systemu, która po świeżej zmianie DNS bywa nieaktualna.
IP=$(dig +short $D A | head -1); IPW=$(dig +short $W A | tail -1)
CURL="curl -s -m 15 --resolve $D:80:$IP --resolve $D:443:$IP --resolve $W:80:$IPW --resolve $W:443:$IPW"
code() { $CURL -o /dev/null -w '%{http_code} %{redirect_url}' "$1"; }

[ -n "$(dig +short $D A)" ] && ok "DNS $D -> $(dig +short $D A | tr '\n' ' ')" || bad "DNS $D brak rekordu A"
[ -n "$(dig +short $W A)" ] && ok "DNS $W -> $(dig +short $W A | tr '\n' ' ')" || bad "DNS $W brak rekordu A"
for h in $D $W; do
  cert=$(echo | openssl s_client -servername $h -connect $IP:443 2>/dev/null | openssl x509 -noout -text 2>/dev/null | grep -E "DNS:|Not After")
  echo "$cert" | grep -q "DNS:$h" && ok "SSL $h ($(echo "$cert" | grep "Not After" | sed "s/.*: //"))" || bad "SSL $h: certyfikat nie obejmuje tej nazwy"
done
# Każdy wariant adresu ma skończyć na https://www (GitHub Pages robi http://bez-www -> http://www -> https://www, 2 skoki)
for u in http://$D/ http://$W/ https://$D/; do
  r=$($CURL -L -o /dev/null -w '%{http_code} %{url_effective} %{num_redirects}' "$u")
  case "$r" in "200 https://$W/ "*) ok "$u -> https://$W/ (przekierowań: ${r##* })";; *) bad "$u -> $r";; esac
done
r=$(code https://$W/); [ "${r%% *}" = 200 ] && ok "https://$W/ 200" || bad "https://$W/ -> $r"
html=$($CURL https://$W/)
echo "$html" | grep -q 'href="https://www.youtube.com/@kontekstowniktv"' && ok "link YouTube w HTML" || bad "brak linku YouTube"
echo "$html" | grep -q 'href="https://www.tiktok.com/@kontekstownik"' && ok "link TikTok w HTML" || bad "brak linku TikTok"
for a in $(echo "$html" | grep -oE '(href|src)="/[^"]+"' | sed -E 's/^[a-z]+="//; s/"$//' | sort -u) /og-image.jpg /robots.txt /sitemap.xml; do
  c=$($CURL -o /dev/null -w '%{http_code}' "https://$W$a"); [ "$c" = 200 ] && ok "zasób $a" || bad "zasób $a -> $c"
done
r=$(code https://$W/nie-istnieje); [ "${r%% *}" = 404 ] && ok "404 dla nieistniejącej strony" || bad "nieistniejąca strona -> $r"
exit $FAIL
