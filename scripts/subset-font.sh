#!/bin/sh
# Montserrat Variable (OFL), wagi 400–800, dwa pliki WOFF2 jak w @fontsource:
#   latin     – podstawowa łacina, interpunkcja, strzałka
#   latin-ext – polskie znaki (ładowany tylko, gdy na stronie są ą, ę, ś…; tu: zawsze, ale mały)
# Plik latin-ext z @fontsource NIE zawiera podstawowych liter, stąd dwa źródła.
# Wymaga fonttools+brotli (venv: python3 -m venv ~/.cache/kontekst-venv && pip install fonttools brotli).
set -e
SRC=node_modules/@fontsource-variable/montserrat/files
PY=${PY:-$HOME/.cache/kontekst-venv/bin}
TMP=$(mktemp -d)
build() { # $1 źródło (latin|latin-ext), $2 zakres, $3 wynik
  "$PY/python3" -c "from fontTools.ttLib.woff2 import decompress; decompress('$SRC/montserrat-$1-wght-normal.woff2', '$TMP/$1.ttf')"
  "$PY/fonttools" varLib.instancer "$TMP/$1.ttf" wght=400:800 -o "$TMP/$1-i.ttf" -q
  "$PY/pyftsubset" "$TMP/$1-i.ttf" --unicodes="$2" --layout-features='kern,liga' --flavor=woff2 --output-file="public/fonts/$3"
}
build latin "U+0020-007E,U+00A0,U+00D3,U+00F3,U+2013-2014,U+2019,U+201C-201E,U+2026,U+2190-2192,U+2197" montserrat-latin-v2.woff2
build latin-ext "U+0104-0107,U+0118-0119,U+0141-0144,U+015A-015B,U+0179-017C" montserrat-latin-ext-v2.woff2
rm -rf "$TMP"
"$PY/python3" -c "
from fontTools.ttLib import TTFont
for f in ['montserrat-latin-v2','montserrat-latin-ext-v2']:
    print(f, len(TTFont('public/fonts/'+f+'.woff2').getBestCmap()), 'znaków')"
ls -l public/fonts
