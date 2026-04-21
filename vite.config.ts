import { serwist } from '@serwist/vite';
import { devtools } from '@tanstack/devtools-vite';
import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import { defineConfig } from 'vite-plus';

import tailwindcss from '@tailwindcss/vite';
import viteReact from '@vitejs/plugin-react';
import { nitro } from 'nitro/vite';

const config = defineConfig({
  staged: {
    '*': 'vp check --fix',
  },
  lint: { options: { typeAware: true, typeCheck: true } },
  fmt: {
    singleQuote: true,
    semi: true,
  },
  resolve: { tsconfigPaths: true },
  plugins: [
    devtools(),
    nitro({ rollupConfig: { external: [/^@sentry\//] } }),
    tailwindcss(),
    tanstackStart(),
    viteReact(),
    serwist({
      swSrc: 'src/sw.ts',
      swDest: 'sw.js',
      globDirectory: '.output/public',
      injectionPoint: 'self.__SW_MANIFEST',
      rollupFormat: 'iife',
    }),
  ],
});

export default config;
