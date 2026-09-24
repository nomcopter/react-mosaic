// @vitest-environment node
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { beforeAll, describe, expect, it } from 'vitest';

interface LessCompiler {
  render(
    input: string,
    options: { filename: string },
  ): Promise<{ css: string }>;
}

const require = createRequire(import.meta.url);
const less = require('less') as LessCompiler;

async function compileMosaicStyles(): Promise<string> {
  const filename = join(dirname(fileURLToPath(import.meta.url)), 'mosaic.less');
  const { css } = await less.render(readFileSync(filename, 'utf8'), {
    filename,
  });
  return css;
}

/** Declarations of every rule whose selector list contains `selector`, merged in source order. */
function declarationsFor(css: string, selector: string): Map<string, string> {
  const declarations = new Map<string, string>();
  for (const match of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const selectors = match[1].split(',').map((s) => s.trim());
    if (!selectors.includes(selector)) {
      continue;
    }
    for (const declaration of match[2].split(';')) {
      const colon = declaration.indexOf(':');
      if (colon > 0) {
        declarations.set(
          declaration.slice(0, colon).trim(),
          declaration.slice(colon + 1).trim(),
        );
      }
    }
  }
  return declarations;
}

function px(value: string | undefined): number {
  if (value === undefined || value === '0') {
    return 0;
  }
  const match = /^(-?\d+(?:\.\d+)?)px$/.exec(value);
  if (!match) {
    throw new Error(`Expected a px length, got ${String(value)}`);
  }
  return Number(match[1]);
}

/** Horizontal margins from a `margin` shorthand (1 to 4 values). */
function horizontalMargins(value: string | undefined): [number, number] {
  const parts = (value ?? '0').split(/\s+/);
  const right = parts[1] ?? parts[0];
  const left = parts[3] ?? right;
  return [px(left), px(right)];
}

/**
 * Horizontal space a shown drop target adds to the tab strip: its border box,
 * its margins, and the extra flex gap it creates by becoming a flex item.
 */
function addedSpace(declarations: Map<string, string>, gap: number): number {
  const [left, right] = horizontalMargins(declarations.get('margin'));
  // With content-box sizing the padding adds to the width.
  const padding =
    declarations.get('box-sizing') === 'border-box'
      ? 0
      : px(declarations.get('padding-left'));
  return px(declarations.get('width')) + padding + left + right + gap;
}

describe('tab drop targets', () => {
  let css = '';
  let gap = 0;

  beforeAll(async () => {
    css = await compileMosaicStyles();
    gap = px(
      declarationsFor(css, '.mosaic-tabs-container .mosaic-tab-bar-tabs').get(
        'gap',
      ),
    );
  });

  it('reads the tab strip gap', () => {
    expect(gap).toBeGreaterThan(0);
  });

  it('do not shift the tabs when a drag starts', () => {
    const dragging = declarationsFor(css, '.tab-drop-target.dragging');
    expect(dragging.get('display')).toBe('flex');
    expect(px(dragging.get('width'))).toBeGreaterThan(0);
    expect(addedSpace(dragging, gap)).toBe(0);
  });

  it('keep the first and last targets inside the strip without shifting tabs', () => {
    const base = declarationsFor(css, '.tab-drop-target.dragging');
    for (const edge of [':first-child', ':last-child']) {
      const merged = new Map([
        ...base,
        ...declarationsFor(css, `.tab-drop-target.dragging${edge}`),
      ]);
      const [left, right] = horizontalMargins(merged.get('margin'));
      // A negative margin on the strip-edge side would push the target out of
      // the scrolling strip, where the tab bar's own drop target wins.
      expect(edge === ':first-child' ? left : right).toBe(0);
      expect(addedSpace(merged, gap)).toBe(0);
    }
  });

  it('do not grow the hovered target', () => {
    const hover = declarationsFor(
      css,
      '.tab-drop-target.tab-drop-target-hover',
    );
    expect(hover.has('width')).toBe(false);
  });
});
