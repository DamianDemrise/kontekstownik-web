// Generuje src/scripts/globe-data.js: kropki lądów (siatka na sferze) zakodowane base64.
// Uruchamiane ręcznie (npm run assets); wynik jest w repo, więc build nie potrzebuje world-atlas.
import { readFileSync, writeFileSync } from 'node:fs';
import { geoContains } from 'd3-geo';
import { feature } from 'topojson-client';

const topo = JSON.parse(readFileSync(new URL('../node_modules/world-atlas/land-110m.json', import.meta.url)));
const land = feature(topo, topo.objects.land);
const STEP = 1.55;
const pts = [];
for (let lat = -58; lat <= 82; lat += STEP) {
  const lonStep = STEP / Math.cos((lat * Math.PI) / 180);
  for (let lon = -180; lon < 180; lon += lonStep) {
    if (geoContains(land, [lon, lat])) pts.push(Math.round((lon + 180) * 10), Math.round((lat + 90) * 10));
  }
}
const buf = Buffer.from(new Uint16Array(pts).buffer);
writeFileSync(
  new URL('../src/scripts/globe-data.js', import.meta.url),
  `// Wygenerowane przez scripts/build-globe-data.mjs (Natural Earth 110m, domena publiczna). Nie edytuj ręcznie.\nexport default '${buf.toString('base64')}';\n`
);
console.log(`globe-data: ${pts.length / 2} punktów, ${buf.length} B`);
