import { defineConfig } from 'vite';
import { resolve } from 'node:path';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { loadMaterials, renderCovers, contentDir } from './scripts/materials.mjs';
import { renderSection, renderPage, renderSitemap } from './scripts/materials-render.mjs';

const root = import.meta.dirname;

// Podstrony materiałów: źródłowe HTML generowane do materialy/<slug>/index.html (katalog w .gitignore),
// żeby Vite przetworzył je jak zwykłe strony. Okładki WebP/OG i sitemap.xml emituje plugin.
async function prepareMaterials() {
  const items = await loadMaterials();
  const covers = await renderCovers(items);
  const dir = resolve(root, 'materialy');
  rmSync(dir, { recursive: true, force: true });
  const inputs = {};
  for (const m of items) {
    mkdirSync(resolve(dir, m.slug), { recursive: true });
    writeFileSync(resolve(dir, m.slug, 'index.html'), renderPage(m, items));
    inputs[`material-${m.slug}`] = resolve(dir, m.slug, 'index.html');
  }
  return { items, covers, inputs };
}

function materials(data) {
  return {
    name: 'kontekstownik-materialy',
    transformIndexHtml(html, ctx) {
      if (ctx.filename !== resolve(root, 'index.html')) return html;
      const { hint, section } = renderSection(data.items);
      // Ze stopką pod materiałami stopka płynie w dokumencie; bez nich siedzi na dole pierwszego ekranu.
      return html.replace('<!--materialy:hint-->', hint).replace('<!--materialy:section-->', section)
        .replace('<footer class="legal">', section ? '<footer class="legal legal--static">' : '<footer class="legal">');
    },
    async generateBundle() {
      for (const c of data.covers) this.emitFile({ type: 'asset', fileName: c.fileName, source: await c.render() });
      this.emitFile({ type: 'asset', fileName: 'sitemap.xml', source: renderSitemap(data.items) });
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
  return {
    plugins: [materials(data)],
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      assetsInlineLimit: 0, // osobne pliki: prostszy CSP i cache
      target: 'es2020',
      rollupOptions: {
        input: {
          main: resolve(root, 'index.html'),
          privacy: resolve(root, 'polityka-prywatnosci/index.html'),
          ...data.inputs,
        },
      },
    },
    server: { port: 5178, strictPort: true },
    preview: { port: 4188, strictPort: true },
  };
});
