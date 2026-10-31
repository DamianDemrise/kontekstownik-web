// Kontrola dist/: wymagane pliki, ścieżki zasobów w HTML/CSS istnieją, brak map i plików roboczych.
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const DIST = new URL('../dist/', import.meta.url).pathname;
const required = ['index.html', '404.html', '.htaccess', 'robots.txt', 'sitemap.xml', 'favicon.svg', 'favicon-32.png',
  'apple-touch-icon.png', 'og-image.jpg', 'site.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png', 'fonts/montserrat-pl-v1.woff2'];
const errors = [];
for (const f of required) if (!existsSync(join(DIST, f))) errors.push(`brak pliku: ${f}`);

const walk = (d) => readdirSync(d).flatMap((f) => (statSync(join(d, f)).isDirectory() ? walk(join(d, f)) : [join(d, f)]));
const files = walk(DIST);
for (const f of files) {
  if (f.endsWith('.map')) errors.push(`mapa źródeł w dist: ${f}`);
  if (/\.(html|css)$/.test(f)) {
    const src = readFileSync(f, 'utf8');
    const refs = [...src.matchAll(/(?:href|src)="(\/[^"#?]*)"|url\(["']?(\/[^"')]+)["']?\)/g)].map((m) => m[1] || m[2]);
    for (const r of refs) if (r !== '/' && !existsSync(join(DIST, r))) errors.push(`${f.replace(DIST, '')}: brak zasobu ${r}`);
  }
}
const total = files.reduce((s, f) => s + statSync(f).size, 0);
console.log(`dist: ${files.length} plików, ${(total / 1024).toFixed(1)} KB`);
if (errors.length) { console.error(errors.join('\n')); process.exit(1); }
console.log('check-dist: OK');
