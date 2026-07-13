// Package-level tests for the BUILT artifacts in dist/libs/react-mosaic-component.
//
// These verify the shipped package loads in plain Node the way consumers use
// it — outside any bundler:
//   1. CJS require() under Node 18 module semantics (require(esm) disabled):
//      the CJS bundle must stay self-contained w.r.t. ESM-only dependencies
//      (lodash-es, the react-dnd v16 family), see tsup.config.ts.
//   2. Native ESM import of index.mjs.
//   3. Resolution by package name through the `exports` map (both conditions).
//   4. CJS/ESM named-export parity.
//
// Run via `npm run test:package` (requires `npm run build:lib` first — the
// nx target `react-mosaic-component:test-package` handles the ordering).
// Types-level wiring is covered separately by `attw --pack`.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import {
  existsSync,
  mkdtempSync,
  mkdirSync,
  symlinkSync,
  rmSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const distDir = join(repoRoot, 'dist', 'libs', 'react-mosaic-component');

// A representative slice of the public API (src/index.ts) — components,
// context, and tree utilities — to catch a broken or partial export surface.
const EXPECTED_EXPORTS = [
  'Mosaic',
  'MosaicWindow',
  'MosaicContext',
  'MosaicWithoutDragDropContext',
  'updateTree',
  'createRemoveUpdate',
  'getLeaves',
  'isSplitNode',
  'isTabsNode',
];

// Prints the module's export names and the type of `Mosaic` as JSON.
const REPORT_CJS =
  'const m = require(process.argv[1]);' +
  'process.stdout.write(JSON.stringify({ keys: Object.keys(m).sort(), mosaicType: typeof m.Mosaic }));';
const REPORT_ESM =
  'const m = await import(process.argv[1]);' +
  'process.stdout.write(JSON.stringify({ keys: Object.keys(m).sort(), mosaicType: typeof m.Mosaic }));';

if (!existsSync(join(distDir, 'index.cjs'))) {
  throw new Error(
    `Built package not found at ${distDir} — run \`npm run build:lib\` first.`,
  );
}

function runNode(args, options = {}) {
  const stdout = execFileSync(process.execPath, args, {
    encoding: 'utf8',
    ...options,
  });
  return JSON.parse(stdout);
}

function assertMosaicModule({ keys, mosaicType }) {
  assert.equal(mosaicType, 'function', 'Mosaic must be exported as a function');
  for (const name of EXPECTED_EXPORTS) {
    assert.ok(keys.includes(name), `missing expected export "${name}"`);
  }
}

// Interop artifacts that legitimately differ between the two formats.
function namedExports(keys) {
  return keys.filter(
    (k) => k !== 'default' && k !== '__esModule' && k !== 'module.exports',
  );
}

// Creates <tmp>/node_modules/react-mosaic-component -> distDir so bare
// `require('react-mosaic-component')` / `import('react-mosaic-component')`
// resolve through the real `exports` map. 'junction' works unprivileged on
// Windows and falls back to a directory symlink on POSIX.
function withLinkedPackage(fn) {
  const tmp = mkdtempSync(join(tmpdir(), 'react-mosaic-pkg-'));
  try {
    mkdirSync(join(tmp, 'node_modules'));
    symlinkSync(
      distDir,
      join(tmp, 'node_modules', 'react-mosaic-component'),
      'junction',
    );
    return fn(tmp);
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
}

test('index.cjs loads via require() with require(esm) disabled (Node 18 semantics)', () => {
  const report = runNode([
    '--no-experimental-require-module',
    '-e',
    REPORT_CJS,
    join(distDir, 'index.cjs'),
  ]);
  assertMosaicModule(report);
});

test('index.mjs loads via native ESM import', () => {
  const report = runNode([
    '--input-type=module',
    '-e',
    REPORT_ESM,
    pathToFileURL(join(distDir, 'index.mjs')).href,
  ]);
  assertMosaicModule(report);
});

test('package name resolves through the exports map for require() and import()', () => {
  withLinkedPackage((tmp) => {
    const cjsReport = runNode(
      [
        '--no-experimental-require-module',
        '-e',
        "const m = require('react-mosaic-component');" +
          'process.stdout.write(JSON.stringify({ keys: Object.keys(m).sort(), mosaicType: typeof m.Mosaic }));',
      ],
      { cwd: tmp },
    );
    assertMosaicModule(cjsReport);

    const esmReport = runNode(
      [
        '--input-type=module',
        '-e',
        "const m = await import('react-mosaic-component');" +
          'process.stdout.write(JSON.stringify({ keys: Object.keys(m).sort(), mosaicType: typeof m.Mosaic }));',
      ],
      { cwd: tmp },
    );
    assertMosaicModule(esmReport);
  });
});

test('CJS and ESM entry points expose identical named exports', () => {
  const cjs = runNode([
    '--no-experimental-require-module',
    '-e',
    REPORT_CJS,
    join(distDir, 'index.cjs'),
  ]);
  const esm = runNode([
    '--input-type=module',
    '-e',
    REPORT_ESM,
    pathToFileURL(join(distDir, 'index.mjs')).href,
  ]);
  assert.deepEqual(namedExports(cjs.keys), namedExports(esm.keys));
});
