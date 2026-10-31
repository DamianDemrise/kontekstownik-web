import { defineConfig } from 'vite';
import { resolve } from 'node:path';

export default defineConfig({
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
