// `npm run materialy:check` – sama walidacja content/materialy.json (bez builda). Zwraca listę opublikowanych.
import { loadMaterials, contentDir } from './materials.mjs';
try {
  const items = await loadMaterials();
  console.log(`${contentDir()}/materialy.json: OK, opublikowanych ${items.length}`);
  for (const m of items) console.log(`  ${m.date}  ${m.id}  [${m.category}]  ${m.primary}`);
} catch (e) { console.error(e.message); process.exit(1); }
