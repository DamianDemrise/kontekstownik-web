import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';
const R = process.env.HOME + '/Desktop/Projekty/kontekstownik-web/';
const svg = (n) => readFileSync(R + 'brand/svg/' + n, 'utf8');
const f = (n) => 'data:font/woff2;base64,' + readFileSync(R + 'public/fonts/' + n).toString('base64');
const html = `<style>
@font-face{font-family:M;src:url(${f('montserrat-latin-v2.woff2')});font-weight:400 800;unicode-range:U+0000-00FF}
@font-face{font-family:M;src:url(${f('montserrat-latin-ext-v2.woff2')});font-weight:400 800;unicode-range:U+0100-017F}
body{margin:0;width:1600px;height:1100px;background:#11171d;font-family:M;color:#F5F7FA}
.g{display:grid;grid-template-columns:1.25fr 1fr;grid-template-rows:auto 1.15fr 1fr;gap:18px;padding:30px;height:100%;box-sizing:border-box}
h1{grid-column:1/-1;margin:0;font-size:28px;font-weight:800}h1 span{color:#AEB9C4;font-weight:500;font-size:17px;margin-left:16px}
.t{border-radius:16px;padding:22px;position:relative;display:flex;flex-direction:column;gap:14px}
.d{background:#080D12}.l{background:#F5F7FA;color:#0B1218}
.lab{font-size:12px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;opacity:.6}
.c svg{width:100%;height:auto}.clear{position:relative;padding:44px;border:2px dashed rgba(255,138,0,.5);border-radius:6px}
.row{display:flex;gap:16px;align-items:center}.sw{width:120px;height:80px;border-radius:10px;display:flex;align-items:flex-end;padding:8px;box-sizing:border-box;font-size:12px;font-weight:700}
ul{margin:0;padding-left:18px;font-size:15px;line-height:1.7}.x{color:#ff7a6b}
.sizes{display:flex;gap:28px;align-items:flex-end}.sizes div{display:flex;flex-direction:column;gap:6px;font-size:12px;color:#AEB9C4}
</style><div class="g"><h1>KONTEKSTOWNIK · zasady logo<span>Kierunek A · Kadr · 31.10.2026</span></h1>
<div class="t d"><span class="lab">Logo i pole ochronne (= wysokość litery K)</span><div class="clear c">${svg('logo-kolor.svg')}</div>
<div class="row" style="gap:22px"><div style="width:160px">${svg('sygnet-kolor.svg')}</div><div style="width:330px">${svg('logo-pionowe-kolor.svg')}</div></div></div>
<div class="t l"><span class="lab">Wersje</span><div class="c" style="width:88%">${svg('logo-na-jasnym.svg')}</div><div class="c" style="width:88%">${svg('logo-czarny.svg')}</div>
<div style="background:#2b3540;padding:16px;border-radius:10px;width:88%" class="c">${svg('logo-bialy.svg')}</div></div>
<div class="t d"><span class="lab">Kolory · minimalne rozmiary</span>
<div class="row"><div class="sw" style="background:#FF8A00;color:#111">#FF8A00</div><div class="sw" style="background:#F5F7FA;color:#111">#F5F7FA</div><div class="sw" style="background:#0B1218;border:1px solid #333">#0B1218</div><div class="sw" style="background:#080D12;border:1px solid #333">#080D12</div></div>
<div class="sizes"><div><div style="width:120px">${svg('logo-kolor.svg')}</div>logo min. 120 px</div><div><div style="width:24px">${svg('sygnet-kolor.svg')}</div>sygnet 24 px</div><div><img src="data:image/png;base64,${readFileSync(R + 'public/favicon-16.png').toString('base64')}" width="16" height="16">favicon 16 px</div></div></div>
<div class="t l"><span class="lab">Czego nie robić</span><ul>
<li class="x">nie zmieniaj koloru narożników ani ich położenia (zawsze lewy górny + prawy dolny)</li>
<li class="x">nie rozciągaj, nie pochylaj, bez cieni, obrysów i gradientów</li>
<li class="x">nie zmieniaj kroju i nie łam słowa – do wąskich miejsc jest wersja pionowa i sygnet</li>
<li class="x">nie stawiaj na zdjęciu bez podkładu przy słabym kontraście</li>
<li class="x">żadnych symboli, barw i haseł partyjnych obok znaku</li></ul></div></div>`;
const b = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' });
const p = await b.newPage({ viewport: { width: 1600, height: 1100 } });
await p.setContent(html); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(300);
await p.screenshot({ path: R + 'brand/karta-zasad.png' }); await b.close(); console.log('ok');
