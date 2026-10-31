#!/bin/sh
# Podzbiór Montserrat Variable (OFL) do znaków łacińskich + polskich, wagi 400–800, jeden WOFF2.
# Wymaga fonttools+brotli (venv: python3 -m venv ~/.cache/kontekst-venv && pip install fonttools brotli).
# Uruchamiać tylko po zmianie fontu; wynik jest w repo.
set -e
SRC=node_modules/@fontsource-variable/montserrat/files/montserrat-latin-ext-wght-normal.woff2
PY=${PY:-$HOME/.cache/kontekst-venv/bin}
TMP=$(mktemp -d)
"$PY/python3" -c "from fontTools.ttLib.woff2 import decompress; decompress('$SRC', '$TMP/m.ttf')"
"$PY/fonttools" varLib.instancer "$TMP/m.ttf" wght=400:800 -o "$TMP/m2.ttf" -q
"$PY/pyftsubset" "$TMP/m2.ttf" \
  --unicodes="U+0020-007E,U+00A0,U+00D3,U+00F3,U+0104-0107,U+0118-0119,U+0141-0144,U+015A-015B,U+0179-017C,U+2013-2014,U+2019,U+201C-201E,U+2026,U+2192" \
  --layout-features='kern,liga' --flavor=woff2 --output-file=public/fonts/montserrat-pl-v1.woff2
rm -rf "$TMP"
ls -l public/fonts
