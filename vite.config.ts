import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const rootDir = dirname(fileURLToPath(import.meta.url));

// Relative base so the build works whether it's served from a domain root
// (Vercel) or a GitHub Pages project path (https://user.github.io/repo/).
export default defineConfig({
  base: './',
  build: {
    rollupOptions: {
      // bm/index.html is generated from index.html by scripts/generate-bm-page.mjs
      // (see the predev/prebuild npm scripts) before Vite ever reads this config.
      input: {
        main: resolve(rootDir, 'index.html'),
        bm: resolve(rootDir, 'bm/index.html'),
      },
    },
  },
});
