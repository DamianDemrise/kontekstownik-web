"""Generator logo KONTEKSTOWNIK (kierunek A · Kadr).

Litery: Montserrat (OFL) ExtraBold 800 z kerningiem (HarfBuzz), zamienione na krzywe – pliki SVG nie zależą od fontu.
Kadr: dwa narożniki (lewy górny, prawy dolny) liczone od rzeczywistej ramki liter.
Wynik: brand/svg/*.svg (wzorce). PNG i pliki strony robi scripts/logo/build_assets.mjs.
Uruchomienie: ~/.cache/kontekst-venv/bin/python3 scripts/logo/build_logo.py  (fonttools, uharfbuzz)
"""
import io, os, json
from fontTools.ttLib import TTFont
from fontTools.ttLib.woff2 import decompress
from fontTools.varLib import instancer
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.boundsPen import BoundsPen
import uharfbuzz as hb

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SRC = os.path.join(ROOT, 'node_modules/@fontsource-variable/montserrat/files/montserrat-latin-wght-normal.woff2')
OUT = os.path.join(ROOT, 'brand/svg')

ORANGE, WHITE, INK, BG = '#FF8A00', '#F5F7FA', '#0B1218', '#080D12'

# --- font: instancja 800 ---
raw = io.BytesIO(); decompress(SRC, raw); raw.seek(0)
font = instancer.instantiateVariableFont(TTFont(raw), {'wght': 800})
buf = io.BytesIO(); font.save(buf); data = buf.getvalue()
glyphs = font.getGlyphSet()
order = font.getGlyphOrder()
CAP = font['OS/2'].sCapHeight  # wysokość wersalików w jednostkach fontu (UPM 1000)

def shape(text, tracking=0):
    """Ścieżka SVG tekstu (y w dół) + ramka [x0,y0,x1,y1]."""
    face = hb.Face(data); f = hb.Font(face)
    b = hb.Buffer(); b.add_str(text); b.guess_segment_properties()
    hb.shape(f, b, {'kern': True, 'liga': False})
    pen = SVGPathPen(glyphs); bounds = BoundsPen(glyphs)
    x = 0
    for info, pos in zip(b.glyph_infos, b.glyph_positions):
        name = order[info.codepoint]
        t = (1, 0, 0, -1, x + pos.x_offset, 0)  # odwrócenie osi Y: SVG rośnie w dół
        glyphs[name].draw(TransformPen(pen, t)); glyphs[name].draw(TransformPen(bounds, t))
        x += pos.x_advance + tracking
    return pen.getCommands(), bounds.bounds

# --- geometria kadru (w jednostkach fontu) ---
T = 124            # grubość ramienia narożnika ≈ 0,8 grubości trzonu litery
GAP = 118          # odstęp narożnika od liter
ARM_H = 600        # długość ramienia poziomego
ARM_V = 470        # długość ramienia pionowego

def corner_tl(x, y, h=ARM_H, v=ARM_V, t=T):
    return f'M{x} {y}h{h}v{t}h{-(h - t)}v{v - t}h{-t}z'

def corner_br(x, y, h=ARM_H, v=ARM_V, t=T):
    # (x, y) = zewnętrzny róg prawy dolny
    return f'M{x} {y}h{-h}v{-t}h{h - t}v{-(v - t)}h{t}z'

def fmt(n): return f'{n:.1f}'.rstrip('0').rstrip('.')

def svg(view, body, title):
    x0, y0, w, h = view
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{fmt(x0)} {fmt(y0)} {fmt(w)} {fmt(h)}" role="img" aria-label="{title}">'
            f'<title>{title}</title>{body}</svg>\n')

def write(name, content):
    with open(os.path.join(OUT, name), 'w') as fh: fh.write(content)

# 1) Logo poziome
word, (wx0, wy0, wx1, wy1) = shape('KONTEKSTOWNIK')
tl = (wx0 - GAP - T, wy0 - GAP - T)                 # zewnętrzny róg lewy górny
br = (wx1 + GAP + T, wy1 + GAP + T)                 # zewnętrzny róg prawy dolny
corners = corner_tl(*tl) + corner_br(*br)
view = (tl[0], tl[1], br[0] - tl[0], br[1] - tl[1])
for suffix, fg, ac in [('kolor', WHITE, ORANGE), ('na-jasnym', INK, ORANGE), ('bialy', WHITE, WHITE), ('czarny', INK, INK)]:
    write(f'logo-{suffix}.svg', svg(view, f'<path fill="{ac}" d="{corners}"/><path fill="{fg}" d="{word}"/>', 'KONTEKSTOWNIK'))
write('logo-kadr.svg', svg(view, f'<path fill="{ORANGE}" d="{corners}"/>', 'kadr'))   # do animacji na stronie
write('logo-litery.svg', svg(view, f'<path fill="{WHITE}" d="{word}"/>', 'KONTEKSTOWNIK'))

# 2) Sygnet: K w kadrze, wyśrodkowany optycznie
k, (kx0, ky0, kx1, ky1) = shape('K')
kw, kh = kx1 - kx0, ky1 - ky0
KT, KGAP, KH, KV = 88, 84, 330, 280                 # proporcje kadru dla pojedynczej litery
ktl = (kx0 - KGAP - KT, ky0 - KGAP - KT); kbr = (kx1 + KGAP + KT, ky1 + KGAP + KT)
kcorners = corner_tl(*ktl, KH, KV, KT) + corner_br(*kbr, KH, KV, KT)
cx, cy = (ktl[0] + kbr[0]) / 2, (ktl[1] + kbr[1]) / 2
# Sygnet w kwadracie; narożniki (skrajne punkty na przekątnej) mieszczą się w kole awatara z zapasem.
half = max(kbr[0] - ktl[0], kbr[1] - ktl[1]) / 2
diag = ((kbr[0] - cx) ** 2 + (kbr[1] - cy) ** 2) ** 0.5
S = diag / 0.40                                     # bok kwadratu: narożnik w 80% promienia koła
mview = (cx - S / 2, cy - S / 2, S, S)
for suffix, fg, ac in [('kolor', WHITE, ORANGE), ('na-jasnym', INK, ORANGE), ('bialy', WHITE, WHITE), ('czarny', INK, INK)]:
    write(f'sygnet-{suffix}.svg', svg(mview, f'<path fill="{ac}" d="{kcorners}"/><path fill="{fg}" d="{k}"/>', 'KONTEKSTOWNIK'))
# Awatar / ikona: sygnet na tle marki (kwadrat; platformy same przycinają do koła)
write('awatar.svg', svg(mview, f'<rect x="{fmt(mview[0])}" y="{fmt(mview[1])}" width="{fmt(S)}" height="{fmt(S)}" fill="{BG}"/>'
                        f'<path fill="{ORANGE}" d="{kcorners}"/><path fill="{WHITE}" d="{k}"/>', 'KONTEKSTOWNIK'))

# 3) Favicon: wersja uproszczona do 16–32 px – większa litera, grubszy i krótszy kadr, bez zbędnych odstępów
FT, FGAP, FH, FV = 120, 70, 300, 260
ftl = (kx0 - FGAP - FT, ky0 - FGAP - FT); fbr = (kx1 + FGAP + FT, ky1 + FGAP + FT)
fcorners = corner_tl(*ftl, FH, FV, FT) + corner_br(*fbr, FH, FV, FT)
fcx, fcy = (ftl[0] + fbr[0]) / 2, (ftl[1] + fbr[1]) / 2
FS = max(fbr[0] - ftl[0], fbr[1] - ftl[1]) * 1.12
fview = (fcx - FS / 2, fcy - FS / 2, FS, FS)
r = FS * 0.2
write('favicon.svg', svg(fview, f'<rect x="{fmt(fview[0])}" y="{fmt(fview[1])}" width="{fmt(FS)}" height="{fmt(FS)}" rx="{fmt(r)}" fill="{BG}"/>'
                         f'<path fill="{ORANGE}" d="{fcorners}"/><path fill="{WHITE}" d="{k}"/>', 'KONTEKSTOWNIK'))
write('favicon-pelne-tlo.svg', svg(fview, f'<rect x="{fmt(fview[0])}" y="{fmt(fview[1])}" width="{fmt(FS)}" height="{fmt(FS)}" fill="{BG}"/>'
                         f'<path fill="{ORANGE}" d="{fcorners}"/><path fill="{WHITE}" d="{k}"/>', 'KONTEKSTOWNIK'))

# 4) Logo pionowe: sygnet nad logotypem bez kadru
gap = CAP * 1.15
sc = (wx1 - wx0) * 0.34 / (kbr[0] - ktl[0])       # sygnet = ~1/3 szerokości napisu
mx = (wx0 + wx1) / 2 - (cx - ktl[0]) * sc - (ktl[0]) * sc + 0
top = wy0 - gap - (kbr[1] - ktl[1]) * sc
g = f'<g transform="translate({fmt((wx0 + wx1) / 2 - cx * sc)} {fmt(top - ktl[1] * sc)}) scale({sc:.4f})">'
pv = (wx0 - 40, top - 40, (wx1 - wx0) + 80, wy1 - top + 80)
for suffix, fg, ac in [('kolor', WHITE, ORANGE), ('na-jasnym', INK, ORANGE)]:
    write(f'logo-pionowe-{suffix}.svg', svg(pv, f'{g}<path fill="{ac}" d="{kcorners}"/><path fill="{fg}" d="{k}"/></g><path fill="{fg}" d="{word}"/>', 'KONTEKSTOWNIK'))

meta = {'cap': CAP, 'word_bbox': [wx0, wy0, wx1, wy1], 'logo_view': view, 'sygnet_view': mview, 'favicon_view': fview,
        'corner': {'thickness': T, 'gap': GAP, 'arm_h': ARM_H, 'arm_v': ARM_V}}
write('meta.json', json.dumps(meta, indent=2))
print('OK', {k: [round(v, 1) for v in meta[k]] if isinstance(meta[k], (list, tuple)) else meta[k] for k in ('cap', 'logo_view')})
