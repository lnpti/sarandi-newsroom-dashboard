import { resolve } from 'node:path';
import { readFileSync } from 'node:fs';
import { defineConfig, externalizeDepsPlugin, loadEnv } from 'electron-vite';
import react from '@vitejs/plugin-react';

const pkg = JSON.parse(readFileSync(resolve('package.json'), 'utf-8'));

// Emissora ativa nesta build/execução — default "sarandi". Ex.: STATION=cacique npm run dev
const STATION = process.env.STATION === 'cacique' ? 'cacique' : 'sarandi';

export default defineConfig(({ mode }) => {
  // Só variáveis com o prefixo MAIN_VITE_ chegam no processo main (via .env,
  // nunca commitado — ver .gitignore). É assim que a chave do Firecrawl entra
  // no build sem precisar ser digitada pelo usuário final.
  const env = loadEnv(mode, process.cwd(), 'MAIN_VITE_');

  return {
    main: {
      plugins: [externalizeDepsPlugin()],
      define: {
        __APP_VERSION__: JSON.stringify(pkg.version),
        'process.env.FIRECRAWL_API_KEY': JSON.stringify(env.MAIN_VITE_FIRECRAWL_API_KEY || ''),
        // Embutido em build-time — sem isso, o .exe instalado numa máquina
        // sem a variável STATION setada sempre cairia no default (sarandi),
        // não importa pra qual emissora o instalador foi gerado.
        'process.env.STATION': JSON.stringify(STATION),
      },
    },
    preload: {
      plugins: [externalizeDepsPlugin()],
    },
    renderer: {
      resolve: {
        alias: {
          '@renderer': resolve('src/renderer/src'),
          '@station-assets': resolve(`src/renderer/src/stations/${STATION}`),
        },
      },
      plugins: [react()],
    },
  };
});
