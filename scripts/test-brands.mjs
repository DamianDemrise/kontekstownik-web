// Contract checks on built brand routes: addressability, identity, content isolation and safe links.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read = path => readFileSync(new URL(`../dist/${path}`, import.meta.url),'utf8');
const main = read('index.html');
const kids = read('kids/index.html');
const influ = read('influ/index.html');
for (const [id,html] of [['main',main],['kids',kids],['influ',influ]]) {
  assert.match(html, /aria-label="Wybierz kanał"/);
  for (const path of ['/','/kids/','/influ/']) assert.ok(html.includes(`href="${path}"`));
  assert.equal((html.match(/data-channel="[^"]+" aria-current="page"/g)||[]).length,1,`${id}: one current channel`);
  assert.doesNotMatch(html, /<(?:iframe|video|embed)\b/i,`${id}: external viewing only`);
}
assert.match(main, /rel="canonical" href="https:\/\/www.kontekstownik.pl\/"/);
assert.match(main, /id="materialy"/);
assert.match(main, /id="topic-pl-input"/);
assert.match(kids, /rel="canonical" href="https:\/\/www.kontekstownik.pl\/kids\/"/);
assert.match(influ, /rel="canonical" href="https:\/\/www.kontekstownik.pl\/influ\/"/);
assert.doesNotMatch(kids, /@kontekstownikinflu|rtMQjyIiy5M|DfPX0XItP7Z/);
assert.doesNotMatch(influ, /@kontekstownikkids|DfNhbSTKhlu/);
assert.doesNotMatch(kids, /www\.tiktok\.com/,'Kids TikTok is deferred');
for (const reel of ['DfNhbSTKhlu','DfNhpEBqtMV','DfNh0UPK9AN','DfNiE5Aqsit']) assert.match(kids,new RegExp(reel));
assert.match(influ,/rtMQjyIiy5M/);
assert.match(influ,/DfPX0XItP7Z/);
assert.match(influ,/tiktok\.com\/@kontekstownikinflu\/video\/7703563013369957654/);
assert.match(read('sitemap.xml'),/https:\/\/www.kontekstownik.pl\/kids\//);
assert.match(read('sitemap.xml'),/https:\/\/www.kontekstownik.pl\/influ\//);
assert.match(read('en/index.html'),/aria-label="Choose a channel"/);
console.log('brand route, identity, isolation, existing material and sitemap contracts: OK');
