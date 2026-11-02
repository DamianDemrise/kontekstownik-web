import { defineConfig } from 'vite';
import { resolve } from 'node:path';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { loadMaterials, renderCovers, contentDir } from './scripts/materials.mjs';
import { renderSection, renderPage, renderSitemap, forLang } from './scripts/materials-render.mjs';

import {prepareBrands, brandsPlugin, brandSitemapEntries} from './scripts/brands.mjs';

const root = import.meta.dirname;

// Podstrony materiałów: źródłowe HTML generowane do materialy/<slug>/ i en/materials/<slug>/ (oba w .gitignore),
// żeby Vite przetworzył je jak zwykłe strony. Okładki WebP/OG i sitemap.xml emituje plugin.
async function prepareMaterials() {
  const items = await loadMaterials();
  const covers = await renderCovers(items);
  const inputs = {};
  for (const [lang, rel] of [['pl', 'materialy'], ['en', 'en/materials']]) {
    const dir = resolve(root, rel);
    rmSync(dir, { recursive: true, force: true });
    for (const m of forLang(items, lang)) {
      const slug = lang === 'en' ? m.en.slug || m.slug : m.slug;
      mkdirSync(resolve(dir, slug), { recursive: true });
      writeFileSync(resolve(dir, slug, 'index.html'), renderPage(m, items, lang));
      inputs[`material-${lang}-${slug}`] = resolve(dir, slug, 'index.html');
    }
  }
  return { items, covers, inputs };
}

function materials(data) {
  return {
    name: 'kontekstownik-materialy',
    transformIndexHtml(html, ctx) {
      const lang = { [resolve(root, 'index.html')]: 'pl', [resolve(root, 'en/index.html')]: 'en' }[ctx.filename];
      if (!lang) return html;
      const { hint, section } = renderSection(data.items, lang);
      // Ze stopką pod materiałami stopka płynie w dokumencie; bez nich siedzi na dole pierwszego ekranu.
      return html.replace('<!--materialy:hint-->', hint).replace('<!--materialy:section-->', section)
        .replace('<footer class="legal">', section ? '<footer class="legal legal--static">' : '<footer class="legal">');
    },
    async generateBundle() {
      for (const c of data.covers) this.emitFile({ type: 'asset', fileName: c.fileName, source: await c.render() });
      this.emitFile({ type: 'asset', fileName: 'sitemap.xml', source: renderSitemap(data.items).replace('</urlset>', brandSitemapEntries() + '</urlset>') });
    },
    configureServer(server) {
      // dev: zmiana w content/ wymaga restartu serwera (strony generowane przy starcie)
      server.watcher.add(resolve(contentDir()));
      server.middlewares.use(async (req, res, next) => {
        const c = data.covers.find((f) => `/${f.fileName}` === req.url);
        if (!c) return next();
        res.setHeader('Content-Type', c.fileName.endsWith('.jpg') ? 'image/jpeg' : 'image/webp');
        res.end(await c.render());
      });
    },
  };
}

export default defineConfig(async () => {
  const data = await prepareMaterials();
  const brandInputs = prepareBrands(root);
  return {
    plugins: [materials(data), brandsPlugin()],
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      assetsInlineLimit: 0, // osobne pliki: prostszy CSP i cache
      target: 'es2020',
      rollupOptions: {
        input: {
          main: resolve(root, 'index.html'),
          privacy: resolve(root, 'polityka-prywatnosci/index.html'),
          en: resolve(root, 'en/index.html'),
          enPrivacy: resolve(root, 'en/privacy-policy/index.html'),
          ...data.inputs,
          ...brandInputs,
        },
      },
    },
    server: { port: 5178, strictPort: true },
    preview: { port: 4188, strictPort: true },
  };
});
