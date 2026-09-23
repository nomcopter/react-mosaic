// @vitest-environment node
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

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

describe('blueprint theme', () => {
  it('does not highlight window toolbars on hover while a window is dragged', async () => {
    const css = await compileStyles();
    const hoverSelectors = css
      .split(/[{}]/)
      .flatMap((block) => block.split(','))
      .map((selector) => selector.trim())
      .filter((selector) =>
        selector.includes('.mosaic-window-toolbar.draggable:hover'),
      );

    // One light and one dark rule, each for .mosaic-window and .mosaic-preview,
    // plus the nested .mosaic-window-title rules.
    expect(hoverSelectors).toHaveLength(8);
    for (const selector of hoverSelectors) {
      expect(selector).toMatch(
        /^\.mosaic\.mosaic-blueprint-theme(\.bp5-dark)?:not\(\.-dragging\) /,
      );
    }
  });
});
