import React, { useContext, useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render } from '@testing-library/react';

import { MosaicContext, MosaicRootActions } from './contextTypes';
import { Mosaic } from './Mosaic';
import { MosaicWindow } from './MosaicWindow';
import { MosaicChangeMeta, MosaicNode } from './types';

// jsdom has no DataTransfer; the HTML5 backend reads/writes it on every event.
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

// Lets react-dnd publish the drag source and the deferred hide() run.
const flush = () =>
  act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 10));
  });

// Starts a drag on `source` and ends it without dropping on anything.
async function cancelDrag(source: Element) {
  const dataTransfer = createDataTransfer();
  fireEvent.dragStart(source, { dataTransfer });
  await flush();
  fireEvent.dragEnd(source, { dataTransfer });
  await flush();
}

type Change = [MosaicNode<string> | null, MosaicChangeMeta<string> | undefined];

function renderControlled(initial: MosaicNode<string>) {
  const changes: Change[] = [];
  const onRelease = vi.fn();
  let actions: MosaicRootActions<string> | undefined;

  function CaptureActions() {
    actions = useContext(MosaicContext)
      .mosaicActions as MosaicRootActions<string>;
    return null;
  }

  function App() {
    const [value, setValue] = useState<MosaicNode<string> | null>(initial);
    return (
      <Mosaic<string>
        value={value}
        onChange={(next, meta) => {
          changes.push([next, meta]);
          setValue(next);
        }}
        onRelease={onRelease}
        renderTile={(id, path) => (
          <MosaicWindow<string> title={id} path={path}>
            <CaptureActions />
            {id}
          </MosaicWindow>
        )}
      />
    );
  }

  const getActions = (): MosaicRootActions<string> => {
    if (actions == null) {
      throw new Error('Mosaic actions not captured yet');
    }
    return actions;
  };

  const result = render(<App />);
  return { ...result, changes, onRelease, getActions };
}

const TWO_WINDOWS: MosaicNode<string> = {
  type: 'split',
  direction: 'row',
  splitPercentages: [50, 50],
  children: ['a', 'b'],
};

const WINDOW_AND_TABS: MosaicNode<string> = {
  type: 'split',
  direction: 'row',
  splitPercentages: [50, 50],
  children: ['a', { type: 'tabs', tabs: ['b', 'c'], activeTabIndex: 0 }],
};

describe('drag-start / drag-cancel meta from real drags', () => {
  afterEach(() => {
    cleanup();
  });

  it('restores a cancelled window drag in a controlled parent', async () => {
    const { container, changes, onRelease } = renderControlled(TWO_WINDOWS);
    await flush();

    const windows = container.querySelectorAll('.mosaic-root .mosaic-window');
    await cancelDrag(
      query(windows[1], '.mosaic-window-title[draggable="true"]'),
    );

    expect(changes.map(([, meta]) => meta)).toEqual([
      { type: 'drag-start', path: [1] },
      { type: 'drag-cancel', path: [1] },
    ]);
    // The parent gets the restored tree back, not the hidden one
    expect(changes[changes.length - 1][0]).toEqual(TWO_WINDOWS);
    expect(onRelease).not.toHaveBeenCalled();
  });

  it('restores a cancelled drag of a nested window', async () => {
    const { container, changes, onRelease } = renderControlled({
      type: 'split',
      direction: 'row',
      children: [
        'a',
        { type: 'split', direction: 'column', children: ['b', 'c'] },
      ],
    });
    await flush();

    const windows = container.querySelectorAll('.mosaic-root .mosaic-window');
    await cancelDrag(
      query(windows[2], '.mosaic-window-title[draggable="true"]'),
    );

    expect(changes.map(([, meta]) => meta)).toEqual([
      { type: 'drag-start', path: [1, 1] },
      { type: 'drag-cancel', path: [1, 1] },
    ]);
    // The tree comes back exactly as it was, without percentages it never had
    expect(changes[1][0]).toEqual({
      type: 'split',
      direction: 'row',
      children: [
        'a',
        {
          type: 'split',
          direction: 'column',
          children: ['b', 'c'],
        },
      ],
    });
    expect(onRelease).not.toHaveBeenCalled();
  });

  it('restores a cancelled tab group drag in a controlled parent', async () => {
    const { container, changes, onRelease } = renderControlled(WINDOW_AND_TABS);
    await flush();

    await cancelDrag(query(container, '.mosaic-tab-drag-button'));

    expect(changes.map(([, meta]) => meta)).toEqual([
      { type: 'drag-start', path: [1] },
      { type: 'drag-cancel', path: [1] },
    ]);
    expect(changes[changes.length - 1][0]).toEqual(WINDOW_AND_TABS);
    expect(onRelease).not.toHaveBeenCalled();
  });

  it('emits neither drag-start nor drag-cancel for a cancelled single tab drag', async () => {
    const { container, changes, onRelease } = renderControlled(WINDOW_AND_TABS);
    await flush();

    const tab = Array.from(
      container.querySelectorAll('.mosaic-tab-button'),
    ).find((button) => button.textContent?.includes('c'));
    if (tab == null) {
      throw new Error('tab c not found');
    }
    await cancelDrag(tab);

    expect(changes).toEqual([]);
    expect(onRelease).not.toHaveBeenCalled();
  });

  it('fires a drop meta and no drag-cancel for a successful drop', async () => {
    const { container, changes, onRelease } = renderControlled(TWO_WINDOWS);
    await flush();

    const windows = container.querySelectorAll('.mosaic-root .mosaic-window');
    const source = query(windows[1], '.mosaic-window-title[draggable="true"]');
    const target = query(windows[0], '.drop-target.left');
    const dataTransfer = createDataTransfer();
    fireEvent.dragStart(source, { dataTransfer });
    await flush();
    fireEvent.dragEnter(target, { dataTransfer });
    fireEvent.dragOver(target, { dataTransfer });
    fireEvent.drop(target, { dataTransfer });
    fireEvent.dragEnd(source, { dataTransfer });
    await flush();

    expect(changes.map(([, meta]) => meta?.type)).toEqual([
      'drag-start',
      'drop',
    ]);
    expect(onRelease).toHaveBeenCalledTimes(1);
    expect(onRelease.mock.calls[0][1]).toEqual(
      expect.objectContaining({ type: 'drop' }),
    );
  });
});

describe('replace meta', () => {
  afterEach(() => {
    cleanup();
  });

  it('reports the previous node for replaceWith', async () => {
    const { changes, getActions } = renderControlled({
      type: 'split',
      direction: 'row',
      children: [
        'a',
        { type: 'split', direction: 'column', children: ['b', 'c'] },
      ],
    });
    await flush();

    act(() => getActions().replaceWith([1], 'z'));

    expect(changes[changes.length - 1][1]).toEqual({
      type: 'replace',
      path: [1],
      node: 'z',
      previous: { type: 'split', direction: 'column', children: ['b', 'c'] },
    });
  });

  it('keeps a meta passed to replaceWith', async () => {
    const { changes, getActions } = renderControlled(TWO_WINDOWS);
    await flush();

    act(() => getActions().replaceWith([0], 'z', { type: 'update' }));

    expect(changes[changes.length - 1][1]).toEqual({ type: 'update' });
  });
});
