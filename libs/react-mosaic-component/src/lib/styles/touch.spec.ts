// @vitest-environment node
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { beforeAll, describe, expect, it } from 'vitest';

interface LessCompiler {
  render(
    input: string,
    options: { filename: string; paths: string[] },
  ): Promise<{ css: string }>;
}

const require = createRequire(import.meta.url);
const less = require('less') as LessCompiler;

async function compileStyles(): Promise<string> {
  const filename = join(dirname(fileURLToPath(import.meta.url)), 'index.less');
  const blueprintCore = dirname(
    require.resolve('@blueprintjs/core/package.json'),
  );
  const nodeModules = dirname(dirname(blueprintCore));
  const { css } = await less.render(readFileSync(filename, 'utf8'), {
    filename,
    paths: [nodeModules],
  });
  return css;
}

// All declarations of the rules whose selector list includes `selector`
function declarationsFor(css: string, selector: string): string {
  const matching = css
    .split('}')
    .map((rule) => rule.split('{'))
    .filter(
      (parts) =>
        parts.length === 2 &&
        parts[0]
          .split(',')
          .map((part) => part.trim())
          .includes(selector),
    )
    .map((parts) => parts[1]);
  if (matching.length === 0) {
    throw new Error(`No rule for ${selector}`);
  }
  return matching.join('\n');
}

describe('touch styles', () => {
  let css = '';
  beforeAll(async () => {
    css = await compileStyles();
  });

  it('keeps drag handles from scrolling the page', () => {
    expect(
      declarationsFor(css, '.mosaic-window .mosaic-window-toolbar.draggable'),
    ).toMatch(/touch-action:\s*none/);
    expect(
      declarationsFor(css, '.mosaic-tabs-container .mosaic-tab-drag-button'),
    ).toMatch(/touch-action:\s*none/);
  });

  it('lets the tab strip scroll sideways', () => {
    expect(
      declarationsFor(css, '.mosaic-tabs-container .mosaic-tab-bar-tabs'),
    ).toMatch(/touch-action:\s*pan-x/);
  });

  it('floats the touch drag preview above everything, ignoring the pointer', () => {
    const preview = declarationsFor(css, '.mosaic-touch-drag-preview');
    expect(preview).toMatch(/position:\s*fixed/);
    expect(preview).toMatch(/pointer-events:\s*none/);
    expect(preview).toMatch(/z-index:\s*1001/);
  });
});
