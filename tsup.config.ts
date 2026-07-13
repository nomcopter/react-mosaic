import { defineConfig } from 'tsup';
import { esbuildPluginFilePathExtensions } from 'esbuild-plugin-file-path-extensions';

export default defineConfig({
  bundle: true,
  entry: [
    './libs/react-mosaic-component/src/**/*.ts',
    './libs/react-mosaic-component/src/**/*.tsx',
    '!./libs/react-mosaic-component/src/**/*.spec.*',
  ],
  format: ['cjs', 'esm'],
  dts: true,
  outDir: './dist/libs/react-mosaic-component',
  platform: 'neutral',
  outExtension({ format }) {
    return {
      js: `.${format === 'cjs' ? 'cjs' : 'mjs'}`,
      dts: `.d.${format === 'cjs' ? 'cts' : 'mts'}`,
    };
  },
  esbuildPlugins: [esbuildPluginFilePathExtensions()],
  clean: false,
});
