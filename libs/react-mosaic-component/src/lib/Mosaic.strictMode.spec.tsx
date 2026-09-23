import React, { StrictMode, useState } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { act, cleanup, fireEvent, render } from '@testing-library/react';

import { Mosaic } from './Mosaic';
import { MosaicWindow } from './MosaicWindow';
import { LegacyMosaicNode, MosaicNode } from './types';

// Minimal DataTransfer stand-in: jsdom doesn't implement one and the HTML5
// drag-and-drop backend reads/writes it on every drag event.
function createDataTransfer() {
  const data: Record<string, string> = {};
  return {
    dropEffect: 'move',
    effectAllowed: 'all',
    files: [],
    items: [],
    types: [] as string[],
    setData: (type: string, value: string) => {
      data[type] = value;
    },
    getData: (type: string) => data[type] ?? '',
    clearData: () => undefined,
    setDragImage: () => undefined,
  };
}

function query(root: Element, selector: string): Element {
  const element = root.querySelector(selector);
  if (element == null) {
    throw new Error(`No element matches ${selector}`);
  }
  return element;
}

const flush = () =>
  act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 10));
  });

// Regression for #236: under StrictMode the first drag used to find no drop
// targets, so the window vanished on release instead of moving.
describe('Mosaic under React.StrictMode', () => {
  afterEach(() => {
    cleanup();
  });

  const cases: [string, LegacyMosaicNode<string> | MosaicNode<string>][] = [
    [
      'n-ary tree',
      { type: 'split', direction: 'row', children: ['first', 'second'] },
    ],
    [
      'legacy binary tree',
      {
        direction: 'row',
        first: 'first',
        second: 'second',
        splitPercentage: 50,
      },
    ],
  ];

  it.each(cases)(
    'drops a window on the first drag (%s)',
    async (_name, initial) => {
      let latest: MosaicNode<string> | null = null;

      function App() {
        const [value, setValue] = useState<
          LegacyMosaicNode<string> | MosaicNode<string> | null
        >(initial);
        return (
          <Mosaic<string>
            value={value}
            onChange={(next) => {
              latest = next;
              setValue(next);
            }}
            renderTile={(id, path) => (
              <MosaicWindow<string> title={id} path={path}>
                {id}
              </MosaicWindow>
            )}
          />
        );
      }

      const { container } = render(
        <StrictMode>
          <App />
        </StrictMode>,
      );
      await flush();

      const windows = Array.from(
        container.querySelectorAll('.mosaic-root .mosaic-window'),
      );
      const source = query(
        windows[1],
        '.mosaic-window-title[draggable="true"]',
      );
      const target = query(windows[0], '.drop-target.left');
      const dataTransfer = createDataTransfer();

      fireEvent.dragStart(source, { dataTransfer });
      await flush();
      fireEvent.dragEnter(target, { dataTransfer });
      fireEvent.dragOver(target, { dataTransfer });
      fireEvent.drop(target, { dataTransfer });
      fireEvent.dragEnd(source, { dataTransfer });
      await flush();

      expect(latest).toEqual(
        expect.objectContaining({
          type: 'split',
          direction: 'row',
          children: ['second', 'first'],
        }),
      );
      expect(
        container.querySelectorAll('.mosaic-root .mosaic-window'),
      ).toHaveLength(2);
    },
  );
});
