import { defineConfig } from 'tsup';
import { esbuildPluginFilePathExtensions } from 'esbuild-plugin-file-path-extensions';


export default defineConfig({
  bundle: true,
  entry: ['src/**/*.ts', 'src/**/*.tsx'],
  format: ['cjs', 'esm'],
  dts: true,
  outDir: './lib',
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
