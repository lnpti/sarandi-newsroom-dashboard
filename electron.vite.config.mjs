import { resolve } from 'node:path';
import { readFileSync } from 'node:fs';
import { defineConfig, externalizeDepsPlugin } from 'electron-vite';
import react from '@vitejs/plugin-react';

const pkg = JSON.parse(readFileSync(resolve('package.json'), 'utf-8'));

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    define: {
      __APP_VERSION__: JSON.stringify(pkg.version),
    },
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
  },
  renderer: {
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src'),
      },
    },
    plugins: [react()],
  },
});
