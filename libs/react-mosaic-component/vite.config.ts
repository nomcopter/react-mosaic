/// <reference types='vitest' />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import dts from 'vite-plugin-dts';
import * as path from 'path';

export default defineConfig(() => ({
  root: __dirname,
  cacheDir: '../../node_modules/.vite/libs/react-mosaic-component',
  plugins: [
    react(),
    dts({
      entryRoot: 'src',
      afterDiagnostic: (diagnostic) => {
        if (diagnostic.length) {
          throw new Error('lint failure');
        }
      },
      tsconfigPath: path.join(__dirname, 'tsconfig.lib.json'),
    }),
  ],
  // Configuration for building your library.
  // See: https://vitejs.dev/guide/build.html#library-mode
  build: {
    outDir: '../../dist/libs/react-mosaic-component',
    emptyOutDir: true,
    target: 'esnext',
    sourcemap: true,
    reportCompressedSize: true,
    commonjsOptions: {
      transformMixedEsModules: true,
    },
    lib: {
      // Could also be a dictionary or array of multiple entry points.
      entry: ['src/index.ts', 'src/lib/styles/index.less'],
      name: 'react-mosaic-component',
      fileName: 'index',
      cssFileName: 'react-mosaic-component',
      // Change this to the formats you want to support.
      // Don't forget to update your package.json as well.
      formats: ['es' as const],
    },
    rolldownOptions: {
      // External packages that should not be bundled into your library.
      external: ['react', 'react-dom', 'react/jsx-runtime', 'classnames'],
    },
  },
  test: {
    watch: false,
    globals: true,
    environment: 'jsdom',
    include: ['{src,tests}/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    reporters: ['default'],
    coverage: {
      reportsDirectory: '../../coverage/libs/react-mosaic-component',
      provider: 'v8' as const,
      // Vitest 4 removed `coverage.all`; untested files are only reported
      // when they are matched explicitly.
      include: ['src/**/*.{ts,tsx}'],
    },
  },
}));
