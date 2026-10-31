import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    assetsInlineLimit: 0, // osobne pliki: prostszy CSP i cache
    cssCodeSplit: false,
    target: 'es2020',
  },
  server: { port: 5178, strictPort: true },
  preview: { port: 4188, strictPort: true },
});
