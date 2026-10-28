import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@shared': fileURLToPath(new URL('../shared', import.meta.url)),
    },
  },
  build: {
    // Every flag URL is referenced from the bundle, so inlining small flags as data URLs would
    // ship all of them in the JavaScript instead of fetching only the one displayed.
    assetsInlineLimit: (filePath) => (filePath.includes('/assets/flags/') ? false : undefined),
  },
  test: {
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts',
  },
});
