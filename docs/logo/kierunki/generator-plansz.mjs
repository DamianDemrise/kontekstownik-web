import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';
const ROOT = process.env.HOME + '/Desktop/Projekty/kontekstownik-web/';
const f = (n) => 'data:font/woff2;base64,' + readFileSync(ROOT + 'public/fonts/' + n).toString('base64');
const OR = '#FF8A00', W = '#F5F7FA', BG = '#080D12', INK = '#0B1218';

// --- Elementy znaków (SVG w jednostkach; K w polu 100×100) ---
const K = (c) => `<path fill="${c}" d="M0 0h22v42L62 0h28L50 41l44 59H66L35 57 22 70v30H0z"/>`;
const corner = (c, x, y, s, rot = 0) => `<path fill="none" stroke="${c}" stroke-width="${s * 0.16}" stroke-linecap="square" transform="translate(${x} ${y}) rotate(${rot})" d="M0 ${s}V0h${s}"/>`;

const D = {
  A: {
    name: 'A · Kadr',
    idea: 'Dwa narożniki obejmują temat jak kadr kamery. Rozwinięcie tego, co już masz na stronie i na TikToku – najmniejsza zmiana, największa ciągłość.',
    mono: (fg, ac) => `<svg viewBox="0 0 200 200">${corner(ac, 38, 38, 48)}${corner(ac, 162, 162, 48, 180)}<g transform="translate(57 50) scale(1)">${K(fg)}</g></svg>`,
    word: (fg, ac) => `<span class="w a"><i style="border-color:${ac}" class="c1"></i><b style="color:${fg}">KONTEKSTOWNIK</b><i style="border-color:${ac}" class="c2"></i></span>`,
  },
  B: {
    name: 'B · Klamra',
    idea: 'Trzon litery K jest pomarańczową klamrą „[”. Czytamy: temat w nawiasie, wzięty pod lupę. Jeden element, bardzo charakterystyczny i prosty w małych rozmiarach.',
    mono: (fg, ac) => `<svg viewBox="0 0 200 200"><g transform="translate(46 50)"><path fill="${ac}" d="M0 0h40v18H22v64h18v18H0z"/><path fill="${fg}" d="M22 58 76 0h30L22 90z"/><path fill="${fg}" d="M50 44 106 100H76L36 58z"/></g></svg>`,
    word: (fg, ac) => `<span class="w"><svg class="kb" viewBox="0 0 108 100"><path fill="${ac}" d="M0 0h40v18H22v64h18v18H0z"/><path fill="${fg}" d="M22 58 76 0h30L22 90z"/><path fill="${fg}" d="M50 44 106 100H76L36 58z"/></svg><b style="color:${fg}">ONTEKSTOWNIK</b></span>`,
  },
  C: {
    name: 'C · Orbita',
    idea: 'Pomarańczowa orbita wokół tematu – nawiązanie do globusa ze strony: „szerszy obraz”. Najbardziej „medialny” kierunek, mocny jako awatar.',
    mono: (fg, ac) => `<svg viewBox="0 0 200 200"><circle cx="100" cy="100" r="74" fill="none" stroke="${ac}" stroke-width="10"/><circle cx="152.3" cy="47.7" r="13" fill="${fg}" stroke="${ac}" stroke-width="5"/><g transform="translate(55 52) scale(0.96)">${K(fg)}</g></svg>`,
    word: (fg, ac) => `<span class="w"><b style="color:${fg}">K</b><svg class="ko" viewBox="0 0 100 100"><circle cx="50" cy="50" r="38" fill="none" stroke="${ac}" stroke-width="14"/><circle cx="76.9" cy="23.1" r="11" fill="${fg}" stroke="${ac}" stroke-width="5"/></svg><b style="color:${fg}">NTEKSTOWNIK</b></span>`,
  },
};

const css = `
@font-face{font-family:M;src:url(${f('montserrat-latin-v2.woff2')}) format('woff2');font-weight:400 800;unicode-range:U+0000-00FF}
@font-face{font-family:M;src:url(${f('montserrat-latin-ext-v2.woff2')}) format('woff2');font-weight:400 800;unicode-range:U+0100-017F}
*{box-sizing:border-box}body{margin:0;width:1600px;height:1000px;background:#1a1f25;font-family:M,sans-serif;color:${W}}
.board{display:grid;grid-template-columns:1fr 1fr;grid-template-rows:auto 1fr 1fr;gap:18px;padding:28px;height:100%}
h1{grid-column:1/-1;margin:0;font-size:30px;font-weight:800;display:flex;gap:24px;align-items:baseline}
h1 small{font-size:16px;font-weight:500;color:#aeb9c4;max-width:1050px;line-height:1.45}
.tile{border-radius:16px;display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden}
.tile .lab{position:absolute;left:16px;top:12px;font-size:12px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;opacity:.6}
.dark{background:${BG}}.light{background:#F5F7FA;color:${INK}}
.w{display:inline-flex;align-items:center;font-weight:800;font-size:64px;letter-spacing:-.005em;line-height:1;position:relative}
.w b{font-weight:800}.kb{height:.72em;width:auto;margin-right:.02em}.ko{height:.74em;width:.74em;margin:0 .01em}
.w.a{padding:.42em .5em .42em .55em}.w.a .c1{position:absolute;left:0;top:0;width:.9em;height:.75em;border-top:.12em solid;border-left:.12em solid}
.w.a .c2{position:absolute;right:0;bottom:0;width:.9em;height:.75em;border-bottom:.12em solid;border-right:.12em solid}
.icons{display:flex;gap:34px;align-items:center}
.av{width:200px;height:200px;border-radius:50%;overflow:hidden;background:${BG};box-shadow:0 0 0 1px #2a3440}
.sq{width:200px;height:200px;border-radius:40px;overflow:hidden;background:${BG}}
.av svg,.sq svg{width:100%;height:100%;display:block}
.fav{display:flex;gap:18px;align-items:end;padding:14px 16px;background:#dfe3e8;border-radius:10px}
.fav span{display:block;background:${BG};border-radius:4px;overflow:hidden}.fav svg{display:block;width:100%;height:100%}
.one{display:flex;flex-direction:column;gap:22px;align-items:center}
`;

const b = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' });
const p = await b.newPage({ viewport: { width: 1600, height: 1000 } });
for (const [key, d] of Object.entries(D)) {
  await p.setContent(`<style>${css}</style><div class="board">
  <h1>${d.name}<small>${d.idea}</small></h1>
  <div class="tile dark"><span class="lab">Logotyp · ciemne tło</span>${d.word(W, OR)}</div>
  <div class="tile light"><span class="lab">Logotyp · jasne tło</span>${d.word(INK, OR)}</div>
  <div class="tile dark"><span class="lab">Awatar (koło) · ikona aplikacji · favicon 32/16 px</span>
    <div class="icons"><div class="av">${d.mono(W, OR)}</div><div class="sq">${d.mono(W, OR)}</div>
    <div class="fav"><span style="width:32px;height:32px">${d.mono(W, OR)}</span><span style="width:16px;height:16px">${d.mono(W, OR)}</span></div></div></div>
  <div class="tile light"><span class="lab">Jeden kolor (nadruk, znak wodny)</span>
    <div class="one"><div style="transform:scale(.7)">${d.word(INK, INK)}</div><div style="background:${BG};padding:14px 26px;border-radius:12px;transform:scale(.7)">${d.word(W, W)}</div></div></div>
  </div>`);
  await p.evaluate(() => document.fonts.ready);
  await p.waitForTimeout(300);
  await p.screenshot({ path: `${ROOT}docs/logo/kierunki/kierunek-${key}.png` });
}
await b.close();
console.log('ok');
