import { defineConfig } from 'vite';
import { resolve } from 'node:path';
import { cpSync, existsSync } from 'node:fs';

// Copy data/act3/*.json into dist so the spec, sources and measurements are
// also served as static files (spec section 33).
function act3Data() {
  return {
    name: 'act3-data',
    closeBundle() {
      if (existsSync('data/act3')) cpSync('data/act3', 'dist/data/act3', { recursive: true });
    },
  };
}

export default defineConfig({
  server: { host: true, port: 5173 },
  preview: { host: true, port: 4173 },
  plugins: [act3Data()],
  build: {
    target: 'es2022',
    outDir: 'dist',
    assetsInlineLimit: 0,
    chunkSizeWarningLimit: 3500,
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        classic: resolve(import.meta.dirname, 'classic.html'),
        measure: resolve(import.meta.dirname, 'tools/measure.html'),
      },
    },
  },
  optimizeDeps: {
    exclude: ['@dimforge/rapier3d-compat'],
  },
});
