import { defineConfig, type Options } from 'tsup';
import { esbuildPluginFilePathExtensions } from 'esbuild-plugin-file-path-extensions';

const base: Options = {
  bundle: true,
  dts: true,
  outDir: './dist/libs/react-mosaic-component',
  platform: 'neutral',
  outExtension({ format }) {
    return {
      js: `.${format === 'cjs' ? 'cjs' : 'mjs'}`,
      dts: `.d.${format === 'cjs' ? 'cts' : 'mts'}`,
    };
  },
  clean: false,
};

export default defineConfig([
  // ESM: bundleless per-file output — modern consumers and bundlers resolve
  // the (partly ESM-only) dependencies themselves.
  {
    ...base,
    format: ['esm'],
    entry: [
      './libs/react-mosaic-component/src/**/*.ts',
      './libs/react-mosaic-component/src/**/*.tsx',
      '!./libs/react-mosaic-component/src/**/*.spec.*',
    ],
    esbuildPlugins: [
      // Rewrites RELATIVE import specifiers to carry explicit .mjs
      // extensions for the bundleless output. Bare package imports must be
      // left alone (they need no extension).
      esbuildPluginFilePathExtensions({ filter: /^\.{1,2}\// }),
    ],
  },
  // CJS: a single self-contained file. Several runtime dependencies publish
  // ESM-only packages (lodash-es and the whole react-dnd v16 family); a bare
  // require() of them crashes CJS consumers on Node < 20.19 (no require(esm)
  // support — e.g. Node 18), so they are inlined. Single-file is required for
  // correctness, not just size: per-file inlining would duplicate react-dnd's
  // React contexts across files and break drag-and-drop at runtime. Only the
  // package root is exposed by the exports map, so one file loses nothing.
  {
    ...base,
    format: ['cjs'],
    entry: ['./libs/react-mosaic-component/src/index.ts'],
    noExternal: [
      /^react-dnd/, // react-dnd, react-dnd-html5-backend, -touch-backend, -multi-backend
      'dnd-core',
      'dnd-multi-backend',
      'rdndmb-html5-to-touch',
      'lodash-es',
    ],
    // Still external (all ship CJS): react (peer), classnames,
    // immutability-helper, prop-types, uuid.
  },
]);
