// Okładka pionowa 1080×1920 (TikTok, Shorts, Reels) w stylu marki.
// Pola bezpieczne: treść w górnych ~70% i z dala od prawej krawędzi (tam aplikacje kładą przyciski i opis).
// Użycie: node scripts/logo/build_cover_vertical.mjs --naglowek "Noc w Trybunale" --pytanie "Dlaczego …?" --kategoria polityka --out plik.jpg
import { chromium } from 'playwright';
import sharp from 'sharp';
import { readFileSync } from 'node:fs';

const arg = (k) => { const i = process.argv.indexOf(`--${k}`); return i > -1 ? process.argv[i + 1] : undefined; };
const head = arg('naglowek'), question = arg('pytanie') || '', out = arg('out');
const CATS = { polityka: ['Polityka', 'instytucje'], gospodarka: ['Gospodarka', 'obieg'], spoleczenstwo: ['Społeczeństwo', 'relacje'], swiat: ['Świat', 'globus'] };
const cat = CATS[arg('kategoria')];
if (!head || !cat || !out) { console.error('Wymagane: --naglowek, --kategoria (polityka|gospodarka|spoleczenstwo|swiat), --out'); process.exit(2); }
if (head.trim().split(/\s+/).length > 6) { console.error('Nagłówek: max 6 słów'); process.exit(2); }

const font = (n) => 'data:font/woff2;base64,' + readFileSync('public/fonts/' + n).toString('base64');
const tpl = readFileSync('content/szablon-okladki/szablon.html', 'utf8');
const motif = tpl.match(new RegExp(`<g class="motyw" id="${cat[1]}">[\\s\\S]*?</g>`))[0].replace('class="motyw"', 'class="m"');
const logo = readFileSync('brand/svg/logo-kolor.svg', 'utf8');
const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const html = `<style>
@font-face{font-family:M;src:url(${font('montserrat-latin-v2.woff2')});font-weight:400 800;unicode-range:U+0000-00FF}
@font-face{font-family:M;src:url(${font('montserrat-latin-ext-v2.woff2')});font-weight:400 800;unicode-range:U+0100-017F}
*{box-sizing:border-box}html,body{margin:0;width:1080px;height:1920px;overflow:hidden}
body{font-family:M;color:#F5F7FA;background:radial-gradient(ellipse 760px 900px at 50% 46%,#1b2a3a,#080D12 78%)}
.grid{position:absolute;left:-20%;right:-20%;bottom:0;height:34%;perspective:520px;perspective-origin:50% 0;-webkit-mask-image:linear-gradient(transparent,#000 40%)}
.grid::before{content:'';position:absolute;inset:0 0 -60%;transform:rotateX(64deg);transform-origin:50% 0;background-image:linear-gradient(rgb(150 175 200/.12) 1px,transparent 1px),linear-gradient(90deg,rgb(150 175 200/.12) 1px,transparent 1px);background-size:80px 80px}
.logo{position:absolute;top:150px;left:0;right:0;display:flex;justify-content:center}.logo svg{width:560px;height:auto}
.motif{position:absolute;top:390px;left:50%;transform:translateX(-50%);width:520px;height:520px}
.motif svg{width:100%;height:100%;fill:none;stroke:#e2eaf2;stroke-width:3.4;stroke-linecap:round;stroke-linejoin:round;filter:drop-shadow(0 0 18px rgb(80 150 220/.25))}
.motif .pomarancz{stroke:#FF8A00}.motif .punkt{fill:#FF8A00;stroke:#080D12;stroke-width:9}
.txt{position:absolute;left:96px;right:150px;top:960px}
.lab{display:flex;align-items:center;gap:22px;margin-bottom:34px}.nar{width:52px;height:52px;border-top:13px solid #FF8A00;border-left:13px solid #FF8A00}
.cat{margin:0;font-size:34px;font-weight:700;letter-spacing:.18em;text-transform:uppercase;color:#FF8A00}
h1{margin:0;font-size:124px;line-height:1.04;font-weight:800;letter-spacing:-3px}
.q{margin:36px 0 0;font-size:46px;line-height:1.28;font-weight:600;color:#d5dde5}
.streak{position:absolute;bottom:420px;height:4px;width:300px;background:linear-gradient(90deg,transparent,#FF8A00);box-shadow:0 0 18px #FF8A00}
</style><div class="grid"></div><div class="streak" style="left:0"></div><div class="streak" style="right:0;transform:scaleX(-1)"></div>
<div class="logo">${logo}</div><div class="motif"><svg viewBox="0 0 448 448">${motif}</svg></div>
<div class="txt"><div class="lab"><span class="nar"></span><p class="cat">${cat[0]}</p></div><h1>${esc(head)}</h1>${question ? `<p class="q">${esc(question)}</p>` : ''}</div>`;

const b = await chromium.launch({ executablePath: process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', ignoreDefaultArgs: ['--headless=old'], args: ['--headless=new', '--force-color-profile=srgb'] });
const p = await b.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
await p.setContent(html);
await p.evaluate(() => document.fonts.ready);
await p.waitForTimeout(300);
const bottom = await p.$eval('.txt', (e) => e.getBoundingClientRect().bottom);
if (bottom > 1920 * 0.78) { console.error(`Tekst schodzi za nisko (${Math.round(bottom)} px) – skróć pytanie`); process.exit(1); }
const png = await p.screenshot({ type: 'png' });
await b.close();
await sharp(png).flatten({ background: '#080D12' }).toColourspace('srgb').withIccProfile('srgb').jpeg({ quality: 92, chromaSubsampling: '4:4:4' }).toFile(out);
console.log(out);
