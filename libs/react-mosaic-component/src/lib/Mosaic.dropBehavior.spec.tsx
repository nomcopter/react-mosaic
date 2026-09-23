import React, { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render } from '@testing-library/react';

import { Mosaic } from './Mosaic';
import { MosaicWindow } from './MosaicWindow';
import { MosaicDropBehavior, MosaicNode } from './types';

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

function renderControlled(
  initial: MosaicNode<string>,
  dropBehavior?: MosaicDropBehavior,
) {
  const onChange = vi.fn();
  const onRelease = vi.fn();

  function App() {
    const [value, setValue] = useState<MosaicNode<string> | null>(initial);
    return (
      <Mosaic<string>
        value={value}
        dropBehavior={dropBehavior}
        onChange={(next) => {
          onChange(next);
          setValue(next);
        }}
        onRelease={onRelease}
        renderTile={(id, path) => (
          <MosaicWindow<string> title={id} path={path}>
            {id}
          </MosaicWindow>
        )}
      />
    );
  }

  const utils = render(<App />);
  return { ...utils, onChange, onRelease };
}

const ROW: MosaicNode<string> = {
  type: 'split',
  direction: 'row',
  splitPercentages: [30, 70],
  children: ['a', 'b'],
};

describe('Mosaic dropBehavior', () => {
  afterEach(() => {
    cleanup();
  });

  describe('drop targets', () => {
    const targetsOf = (container: HTMLElement, title: string) =>
      Array.from(
        windowTitled(container, title).querySelectorAll('.drop-target'),
      ).map((t) => t.className.replace('drop-target ', ''));

    it("renders only edge targets by default ('split')", () => {
      const { container } = renderControlled(ROW);
      expect(targetsOf(container, 'a')).toEqual([
        'top',
        'bottom',
        'left',
        'right',
      ]);
      expect(
        container.querySelectorAll('.mosaic > .drop-target-container'),
      ).toHaveLength(1);
    });

    it("renders one full-window target and no root targets for 'swap'", () => {
      const { container } = renderControlled(ROW, 'swap');
      expect(targetsOf(container, 'a')).toEqual(['swap -fill']);
      expect(
        container.querySelectorAll('.mosaic > .drop-target-container'),
      ).toHaveLength(0);
    });

    it('renders and switches modes without React warnings', () => {
      const consoleError = vi.spyOn(console, 'error');
      const tile = (id: string, path: number[]) => (
        <MosaicWindow<string> title={id} path={path}>
          {id}
        </MosaicWindow>
      );
      const { rerender } = render(
        <Mosaic<string>
          initialValue={ROW}
          dropBehavior="swap"
          renderTile={tile}
        />,
      );
      rerender(
        <Mosaic<string>
          initialValue={ROW}
          dropBehavior="split-and-swap"
          renderTile={tile}
        />,
      );
      expect(consoleError).not.toHaveBeenCalled();
      consoleError.mockRestore();
    });

    it("adds a centre swap target to the edges for 'split-and-swap'", () => {
      const { container } = renderControlled(ROW, 'split-and-swap');
      expect(targetsOf(container, 'a')).toEqual([
        'top',
        'bottom',
        'left',
        'right',
        'swap',
      ]);
      expect(
        container.querySelectorAll('.mosaic > .drop-target-container'),
      ).toHaveLength(1);
    });
  });

  describe('dropping', () => {
    const titleOf = (container: HTMLElement, title: string) =>
      query(
        windowTitled(container, title),
        '.mosaic-window-title[draggable="true"]',
      );

    it("'swap' trades places and keeps every pane's size", async () => {
      const { container, onChange, onRelease } = renderControlled(ROW, 'swap');
      await flush();

      await dragAndDrop(
        titleOf(container, 'b'),
        query(windowTitled(container, 'a'), '.drop-target.swap'),
      );

      const expected = { ...ROW, children: ['b', 'a'] };
      expect(onChange).toHaveBeenLastCalledWith(expected);
      expect(onRelease).toHaveBeenCalledTimes(1);
      expect(onRelease).toHaveBeenCalledWith(
        expected,
        expect.objectContaining({ type: 'drop', swap: true }),
      );
    });

    it("'swap' leaves splitPercentages out when the tree had none", async () => {
      const tree: MosaicNode<string> = {
        type: 'split',
        direction: 'column',
        children: [
          'a',
          { type: 'split', direction: 'row', children: ['b', 'c'] },
        ],
      };
      const { container, onRelease } = renderControlled(tree, 'swap');
      await flush();

      await dragAndDrop(
        titleOf(container, 'c'),
        query(windowTitled(container, 'a'), '.drop-target.swap'),
      );

      expect(onRelease).toHaveBeenCalledWith(
        {
          type: 'split',
          direction: 'column',
          children: [
            'c',
            { type: 'split', direction: 'row', children: ['b', 'a'] },
          ],
        },
        expect.objectContaining({ type: 'drop', swap: true }),
      );
    });

    it("'split-and-swap' still splits on an edge", async () => {
      const { container, onRelease } = renderControlled(ROW, 'split-and-swap');
      await flush();

      await dragAndDrop(
        titleOf(container, 'b'),
        query(windowTitled(container, 'a'), '.drop-target.top'),
      );

      expect(onRelease).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'split',
          direction: 'column',
          children: ['b', 'a'],
        }),
        expect.objectContaining({ type: 'drop' }),
      );
    });

    it("'split-and-swap' swaps on the centre target", async () => {
      const { container, onRelease } = renderControlled(ROW, 'split-and-swap');
      await flush();

      await dragAndDrop(
        titleOf(container, 'b'),
        query(windowTitled(container, 'a'), '.drop-target.swap'),
      );

      expect(onRelease).toHaveBeenCalledWith(
        { ...ROW, children: ['b', 'a'] },
        expect.objectContaining({ type: 'drop', swap: true }),
      );
    });

    it('swaps a tab with a window and shows the swapped-in panel', async () => {
      const tree: MosaicNode<string> = {
        type: 'split',
        direction: 'row',
        children: ['a', { type: 'tabs', tabs: ['b', 'c'], activeTabIndex: 1 }],
      };
      const { container, onRelease } = renderControlled(tree, 'swap');
      await flush();

      const tab = Array.from(
        container.querySelectorAll('.mosaic-tab-button'),
      ).find((t) => t.textContent?.includes('c'));
      if (tab == null) {
        throw new Error('No tab c');
      }

      await dragAndDrop(
        tab,
        query(windowTitled(container, 'a'), '.drop-target.swap'),
      );

      expect(onRelease).toHaveBeenLastCalledWith(
        {
          type: 'split',
          direction: 'row',
          children: [
            'c',
            { type: 'tabs', tabs: ['b', 'a'], activeTabIndex: 1 },
          ],
        },
        expect.objectContaining({ type: 'drop', swap: true }),
      );
    });

    it('swaps in uncontrolled mode', async () => {
      const { container } = render(
        <Mosaic<string>
          initialValue={ROW}
          dropBehavior="swap"
          renderTile={(id, path) => (
            <MosaicWindow<string> title={id} path={path}>
              {id}
            </MosaicWindow>
          )}
        />,
      );
      await flush();

      await dragAndDrop(
        titleOf(container, 'a'),
        query(windowTitled(container, 'b'), '.drop-target.swap'),
      );

      const tiles = Array.from(
        container.querySelectorAll<HTMLElement>('.mosaic-root > .mosaic-tile'),
      );
      const tileOf = (id: string) =>
        tiles.find(
          (t) => t.querySelector('.mosaic-window-title')?.textContent === id,
        )!;
      // b now sits in the 30% slot on the left, a in the 70% slot
      expect(tileOf('b').style.left).toBe('0%');
      expect(tileOf('a').style.right).toBe('0%');
    });
  });
});

async function dragAndCancel(source: Element) {
  const dataTransfer = createDataTransfer();
  fireEvent.dragStart(source, { dataTransfer });
  await flush();
  fireEvent.dragEnd(source, { dataTransfer });
  await flush();
}

describe('Mosaic dropBehavior: tab groups, cancels and active tabs', () => {
  afterEach(() => {
    cleanup();
  });

  const titleOf = (container: HTMLElement, title: string) =>
    query(
      windowTitled(container, title),
      '.mosaic-window-title[draggable="true"]',
    );

  const WITH_GROUP: MosaicNode<string> = {
    type: 'split',
    direction: 'row',
    splitPercentages: [20, 30, 50],
    children: ['a', 'd', { type: 'tabs', tabs: ['b', 'c'], activeTabIndex: 0 }],
  };

  it.each<[MosaicDropBehavior, string]>([
    ['swap', '.drop-target.swap.-fill'],
    ['split-and-swap', '.drop-target.swap:not(.-fill)'],
  ])(
    "swaps a whole tab group with a window in '%s' mode",
    async (mode, target) => {
      const { container, onRelease } = renderControlled(WITH_GROUP, mode);
      await flush();

      await dragAndDrop(
        query(container, '.mosaic-tab-drag-button'),
        query(windowTitled(container, 'a'), target),
      );

      const group = { type: 'tabs', tabs: ['b', 'c'], activeTabIndex: 0 };
      expect(onRelease).toHaveBeenCalledTimes(1);
      expect(onRelease).toHaveBeenLastCalledWith(
        {
          ...WITH_GROUP,
          children: [group, 'd', 'a'],
        },
        expect.objectContaining({ type: 'drop', swap: true }),
      );

      // The next drag still works
      await dragAndDrop(
        titleOf(container, 'd'),
        query(windowTitled(container, 'a'), target),
      );
      expect(onRelease).toHaveBeenCalledTimes(2);
      expect(onRelease).toHaveBeenLastCalledWith(
        {
          ...WITH_GROUP,
          children: [group, 'a', 'd'],
        },
        expect.objectContaining({ type: 'drop', swap: true }),
      );
    },
  );

  it.each<[MosaicDropBehavior | undefined]>([[undefined], ['swap']])(
    'a cancelled window drag gives a controlled parent its sizes back (%s)',
    async (mode) => {
      const { container, onChange, onRelease } = renderControlled(ROW, mode);
      await flush();

      await dragAndCancel(titleOf(container, 'b'));

      expect(onChange).toHaveBeenLastCalledWith(ROW);
      expect(onRelease).not.toHaveBeenCalled();
    },
  );

  it('a cancelled tab group drag gives a controlled parent its sizes back', async () => {
    const { container, onChange, onRelease } = renderControlled(
      WITH_GROUP,
      'swap',
    );
    await flush();

    await dragAndCancel(query(container, '.mosaic-tab-drag-button'));

    expect(onChange).toHaveBeenLastCalledWith(WITH_GROUP);
    expect(onRelease).not.toHaveBeenCalled();
  });

  it('a cancelled drag keeps the sizes in uncontrolled mode', async () => {
    const { container } = render(
      <Mosaic<string>
        initialValue={ROW}
        renderTile={(id, path) => (
          <MosaicWindow<string> title={id} path={path}>
            {id}
          </MosaicWindow>
        )}
      />,
    );
    await flush();

    await dragAndCancel(titleOf(container, 'b'));

    const tileA = Array.from(
      container.querySelectorAll<HTMLElement>('.mosaic-root > .mosaic-tile'),
    ).find((t) => t.querySelector('.mosaic-window-title')?.textContent === 'a');
    // a still takes the left 30%
    expect(tileA?.style.right).toBe('70%');
  });

  it('falls back to equal sizes when the parent changed during the drag', async () => {
    const onRelease = vi.fn();
    let setValue: (tree: MosaicNode<string>) => void = () => undefined;

    function App() {
      const [value, set] = useState<MosaicNode<string> | null>(ROW);
      setValue = set;
      return (
        <Mosaic<string>
          value={value}
          dropBehavior="swap"
          onChange={set}
          onRelease={onRelease}
          renderTile={(id, path) => (
            <MosaicWindow<string> title={id} path={path}>
              {id}
            </MosaicWindow>
          )}
        />
      );
    }

    const { container } = render(<App />);
    await flush();

    const dataTransfer = createDataTransfer();
    fireEvent.dragStart(titleOf(container, 'b'), { dataTransfer });
    await flush();
    // A controlled parent adds a pane while the drag is running
    act(() => {
      setValue({
        type: 'split',
        direction: 'row',
        splitPercentages: [30, 0, 70],
        children: ['a', 'b', 'e'],
      });
    });
    await flush();
    const target = query(windowTitled(container, 'a'), '.drop-target.swap');
    fireEvent.dragEnter(target, { dataTransfer });
    fireEvent.dragOver(target, { dataTransfer });
    fireEvent.drop(target, { dataTransfer });
    fireEvent.dragEnd(titleOf(container, 'b'), { dataTransfer });
    await flush();

    expect(onRelease).toHaveBeenLastCalledWith(
      {
        type: 'split',
        direction: 'row',
        children: ['b', 'a', 'e'],
      },
      expect.objectContaining({ type: 'drop', swap: true }),
    );
  });

  it('keeps the active tab when a background tab is swapped out', async () => {
    const tree: MosaicNode<string> = {
      type: 'split',
      direction: 'row',
      children: [
        'a',
        { type: 'tabs', tabs: ['b', 'c', 'd'], activeTabIndex: 0 },
      ],
    };
    const { container, onRelease } = renderControlled(tree, 'swap');
    await flush();

    const tab = Array.from(
      container.querySelectorAll('.mosaic-tab-button'),
    ).find((t) => t.textContent?.includes('d'));
    if (tab == null) {
      throw new Error('No tab d');
    }

    await dragAndDrop(
      tab,
      query(windowTitled(container, 'a'), '.drop-target.swap'),
    );

    expect(onRelease).toHaveBeenLastCalledWith(
      {
        type: 'split',
        direction: 'row',
        children: [
          'd',
          { type: 'tabs', tabs: ['b', 'c', 'a'], activeTabIndex: 0 },
        ],
      },
      expect.objectContaining({ type: 'drop', swap: true }),
    );
  });
});
