import React, { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render } from '@testing-library/react';

import { Mosaic } from './Mosaic';
import { MosaicWindow } from './MosaicWindow';
import { MosaicNode } from './types';

// jsdom has no DataTransfer, and the HTML5 backend touches it on every event
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

function query(root: ParentNode, selector: string): Element {
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

async function dragAndDrop(source: Element, target: Element) {
  const dataTransfer = createDataTransfer();
  fireEvent.dragStart(source, { dataTransfer });
  await flush();
  fireEvent.dragEnter(target, { dataTransfer });
  fireEvent.dragOver(target, { dataTransfer });
  fireEvent.drop(target, { dataTransfer });
  fireEvent.dragEnd(source, { dataTransfer });
  await flush();
}

const windowTitled = (container: HTMLElement, title: string): Element => {
  const match = Array.from(
    container.querySelectorAll('.mosaic-root .mosaic-window'),
  ).find((w) => w.querySelector('.mosaic-window-title')?.textContent === title);
  if (match == null) {
    throw new Error(`No window titled ${title}`);
  }
  return match;
};

const titleOf = (container: HTMLElement, title: string) =>
  query(
    windowTitled(container, title),
    '.mosaic-window-title[draggable="true"]',
  );

function renderControlled(initial: MosaicNode<string>) {
  const onRelease = vi.fn();

  function App() {
    const [value, setValue] = useState<MosaicNode<string> | null>(initial);
    return (
      <Mosaic<string>
        value={value}
        onChange={setValue}
        onRelease={onRelease}
        renderTile={(id, path) => (
          <MosaicWindow<string> title={id} path={path}>
            {id}
          </MosaicWindow>
        )}
      />
    );
  }

  return { ...render(<App />), onRelease };
}

describe('MosaicWindow drops onto a window in another split', () => {
  afterEach(() => {
    cleanup();
  });

  // The destination path [0, 1] ends with the source path [1], but isn't inside it.
  it('moves a full-width window onto a window in the row above', async () => {
    const { container, onRelease } = renderControlled({
      type: 'split',
      direction: 'column',
      children: [
        { type: 'split', direction: 'row', children: ['a', 'b'] },
        'c',
      ],
    });
    await flush();

    await dragAndDrop(
      titleOf(container, 'c'),
      query(windowTitled(container, 'b'), '.drop-target.bottom'),
    );

    expect(onRelease).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'split',
        direction: 'row',
        children: [
          'a',
          expect.objectContaining({
            type: 'split',
            direction: 'column',
            children: ['b', 'c'],
          }),
        ],
      }),
      expect.objectContaining({ type: 'drop', position: 'bottom' }),
    );
  });

  it('still ignores a drop onto a window inside the dragged one', async () => {
    const { container, onRelease } = renderControlled({
      type: 'split',
      direction: 'row',
      children: ['a', 'b'],
    });
    await flush();

    await dragAndDrop(
      titleOf(container, 'a'),
      query(windowTitled(container, 'a'), '.drop-target.bottom'),
    );

    expect(onRelease).not.toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ type: 'drop' }),
    );
  });
});
