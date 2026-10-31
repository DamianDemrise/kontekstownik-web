import { defineConfig } from 'vite';
import { resolve } from 'node:path';
import { loadMaterials, renderCovers, renderSection, contentDir } from './scripts/materials.mjs';

// Wstawia karty materiałów do index.html i emituje okładki WebP. Źródło: content/ (albo MATERIALY_DIR).
function materials() {
  let items = [];
  let covers = [];
  const load = async () => { items = await loadMaterials(); covers = await renderCovers(items); };
  return {
    name: 'kontekstownik-materialy',
    // Dane wczytujemy na starcie builda, żeby generateBundle miał listę okładek do wyemitowania.
    buildStart: load,
    async transformIndexHtml(html, ctx) {
      if (!ctx.filename.endsWith('/index.html') || ctx.filename.includes('polityka-prywatnosci')) return html;
      if (ctx.server) await load(); // dev: świeże dane przy każdym odświeżeniu
      const { hint, section } = renderSection(items);
      return html.replace('<!--materialy:hint-->', hint).replace('<!--materialy:section-->', section);
    },
    async generateBundle() {
      for (const c of covers) this.emitFile({ type: 'asset', fileName: c.fileName, source: await c.render() });
    },
    configureServer(server) {
      server.watcher.add(resolve(contentDir()));
      server.middlewares.use(async (req, res, next) => {
        const c = covers.find((f) => `/${f.fileName}` === req.url);
        if (!c) return next();
        res.setHeader('Content-Type', 'image/webp');
        res.end(await c.render());
      });
    },
  };
}

export default defineConfig({
  plugins: [materials()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    assetsInlineLimit: 0, // osobne pliki: prostszy CSP i cache
    target: 'es2020',
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        privacy: resolve(import.meta.dirname, 'polityka-prywatnosci/index.html'),
      },
    },
  },
  server: { port: 5178, strictPort: true },
  preview: { port: 4188, strictPort: true },
});
