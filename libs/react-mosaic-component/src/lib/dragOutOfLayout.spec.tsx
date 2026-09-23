import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { HTML5toTouch } from 'rdndmb-html5-to-touch';
import { DndProvider, useDrop } from 'react-dnd';
import { MultiBackend } from 'react-dnd-multi-backend';

import { useMosaicWindow } from './contextHooks';
import { MosaicDragItem, MosaicDropData } from './internalTypes';
import { MosaicWithoutDragDropContext } from './Mosaic';
import { MosaicWindow } from './MosaicWindow';
import { MosaicDragType, MosaicNode, TileRenderer } from './types';

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

const flush = () =>
  act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 10));
  });

const NESTED_TREE: MosaicNode<string> = {
  type: 'split',
  direction: 'row',
  children: ['a', { type: 'split', direction: 'column', children: ['b', 'c'] }],
};

// A drop target outside of the layout, like a sidebar or a trash can
function OutsideTarget({
  result,
  onDropItem,
}: {
  result: MosaicDropData | undefined;
  onDropItem: (item: MosaicDragItem) => void;
}) {
  const [, connectDropTarget] = useDrop<
    MosaicDragItem,
    MosaicDropData | undefined
  >({
    accept: MosaicDragType.WINDOW,
    drop: (item) => {
      onDropItem(item);
      return result;
    },
  });
  return (
    <div
      data-testid="outside"
      ref={(element) => {
        connectDropTarget(element);
      }}
    />
  );
}

interface SetupOptions {
  initial: MosaicNode<string>;
  controlled: boolean;
  result: MosaicDropData | undefined;
  renderTile?: TileRenderer<string>;
}

function setup({ initial, controlled, result, renderTile }: SetupOptions) {
  const onChange = vi.fn();
  const onRelease = vi.fn();
  const onDragEnd = vi.fn();
  const droppedItems: MosaicDragItem[] = [];
  // Lets a test change the controlled value from outside, e.g. mid-drag
  const parent: { setValue?: (next: MosaicNode<string> | null) => void } = {};

  function App() {
    const [value, setValue] = React.useState<MosaicNode<string> | null>(
      initial,
    );
    parent.setValue = setValue;
    const valueProps = controlled
      ? {
          value,
          onChange: (next: MosaicNode<string> | null) => {
            onChange(next);
            setValue(next);
          },
        }
      : { initialValue: initial, onChange };
    return (
      <DndProvider backend={MultiBackend} options={HTML5toTouch}>
        <OutsideTarget
          result={result}
          onDropItem={(item) => droppedItems.push(item)}
        />
        <MosaicWithoutDragDropContext<string>
          {...valueProps}
          onRelease={onRelease}
          renderTile={
            renderTile ??
            ((id, path) => (
              <MosaicWindow<string>
                title={id}
                path={path}
                onDragEnd={onDragEnd}
              >
                {id}
              </MosaicWindow>
            ))
          }
        />
      </DndProvider>
    );
  }

  const utils = render(<App />);
  return { ...utils, onChange, onRelease, onDragEnd, droppedItems, parent };
}

async function dragToOutside(
  container: HTMLElement,
  source: Element,
  duringDrag?: () => void,
) {
  const target = container.querySelector('[data-testid="outside"]');
  if (target == null) {
    throw new Error('Outside drop target is not rendered');
  }
  const dataTransfer = createDataTransfer();
  fireEvent.dragStart(source, { dataTransfer });
  await flush();
  if (duringDrag) {
    act(duringDrag);
    await flush();
  }
  fireEvent.dragEnter(target, { dataTransfer });
  fireEvent.dragOver(target, { dataTransfer });
  fireEvent.drop(target, { dataTransfer });
  fireEvent.dragEnd(source, { dataTransfer });
  await flush();
}

// Window titles, skipping the copies inside each window's drag preview
function titleElements(container: HTMLElement): Element[] {
  return Array.from(
    container.querySelectorAll('.mosaic-root .mosaic-window-title'),
  ).filter((node) => node.closest('.mosaic-preview') == null);
}

function windowTitle(container: HTMLElement, title: string): Element {
  const element = titleElements(container).find(
    (node) => node.textContent === title,
  );
  if (element == null) {
    throw new Error(`No window titled ${title}`);
  }
  return element;
}

function renderedTitles(container: HTMLElement): string[] {
  return titleElements(container)
    .map((node) => node.textContent ?? '')
    .sort();
}

describe('dragging windows out of the layout', () => {
  afterEach(() => {
    cleanup();
  });

  it('puts the path and key of the dragged window on the drag item', async () => {
    const { container, droppedItems } = setup({
      initial: NESTED_TREE,
      controlled: true,
      result: undefined,
    });
    await flush();

    await dragToOutside(container, windowTitle(container, 'c'));

    expect(droppedItems).toHaveLength(1);
    expect(droppedItems[0]).toEqual(
      expect.objectContaining({ path: [1, 1], nodeKey: 'c' }),
    );
  });

  it('removes a nested window when the drop result is { remove: true } (controlled)', async () => {
    const { container, onChange, onRelease, onDragEnd } = setup({
      initial: NESTED_TREE,
      controlled: true,
      result: { remove: true },
    });
    await flush();

    await dragToOutside(container, windowTitle(container, 'c'));

    const expected = expect.objectContaining({
      type: 'split',
      direction: 'row',
      children: ['a', 'b'],
    });
    expect(onChange).toHaveBeenLastCalledWith(expected);
    expect(onRelease).toHaveBeenCalledTimes(1);
    expect(onRelease).toHaveBeenLastCalledWith(expected);
    expect(onDragEnd).toHaveBeenCalledWith('drop');
    expect(renderedTitles(container)).toEqual(['a', 'b']);
  });

  it('removes a window when the drop result is { remove: true } (uncontrolled)', async () => {
    const { container, onRelease } = setup({
      initial: NESTED_TREE,
      controlled: false,
      result: { remove: true },
    });
    await flush();

    await dragToOutside(container, windowTitle(container, 'a'));

    expect(onRelease).toHaveBeenLastCalledWith(
      expect.objectContaining({
        type: 'split',
        direction: 'column',
        children: ['b', 'c'],
      }),
    );
    expect(renderedTitles(container)).toEqual(['b', 'c']);
  });

  it('collapses to a single leaf when one of two windows is removed', async () => {
    const { container, onChange } = setup({
      initial: { type: 'split', direction: 'row', children: ['a', 'b'] },
      controlled: true,
      result: { remove: true },
    });
    await flush();

    await dragToOutside(container, windowTitle(container, 'b'));

    expect(onChange).toHaveBeenLastCalledWith('a');
    expect(renderedTitles(container)).toEqual(['a']);
  });

  it('restores the window when the outside target returns no result', async () => {
    const { container, onRelease, onDragEnd } = setup({
      initial: NESTED_TREE,
      controlled: true,
      result: undefined,
    });
    await flush();

    await dragToOutside(container, windowTitle(container, 'c'));

    expect(onRelease).not.toHaveBeenCalled();
    expect(onDragEnd).toHaveBeenCalledWith('reset');
    expect(renderedTitles(container)).toEqual(['a', 'b', 'c']);
  });

  it('removes a tab when the drop result is { remove: true }', async () => {
    const { container, onChange, droppedItems } = setup({
      initial: { type: 'tabs', tabs: ['a', 'b', 'c'], activeTabIndex: 0 },
      controlled: true,
      result: { remove: true },
    });
    await flush();

    const tabButtons = Array.from(
      container.querySelectorAll('.mosaic-tab-button'),
    );
    await dragToOutside(container, tabButtons[1]);

    expect(droppedItems[0]).toEqual(
      expect.objectContaining({ path: [1], nodeKey: 'b' }),
    );
    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ type: 'tabs', tabs: ['a', 'c'] }),
    );
  });
  it('removes a whole tab group when the drop result is { remove: true }', async () => {
    const { container, onChange } = setup({
      initial: {
        type: 'split',
        direction: 'row',
        children: ['a', { type: 'tabs', tabs: ['b', 'c'], activeTabIndex: 0 }],
      },
      controlled: true,
      result: { remove: true },
    });
    await flush();

    const handle = container.querySelector('.mosaic-tab-drag-button');
    if (handle == null) {
      throw new Error('No tab group drag handle');
    }
    await dragToOutside(container, handle);

    expect(onChange).toHaveBeenLastCalledWith('a');
  });

  describe('when the tree changed during the drag', () => {
    // Drags the whole tile via the window context, which also works for a
    // window shown inside a tab group
    function GripWindow({ id, path }: { id: string; path: number[] }) {
      function Grip() {
        const { mosaicWindowActions } = useMosaicWindow();
        return mosaicWindowActions.connectDragSource(
          <div data-testid={`grip-${id}`}>{id}</div>,
        );
      }
      return (
        <MosaicWindow<string> title={id} path={path}>
          <Grip />
        </MosaicWindow>
      );
    }

    function grip(container: HTMLElement, id: string): Element {
      const element = container.querySelector(`[data-testid="grip-${id}"]`);
      if (element == null) {
        throw new Error(`No grip for ${id}`);
      }
      return element;
    }

    it('removes the dragged tab window, not the tab that became active', async () => {
      const { container, onChange } = setup({
        initial: {
          type: 'split',
          direction: 'row',
          children: [
            'a',
            { type: 'tabs', tabs: ['b', 'c', 'd'], activeTabIndex: 1 },
          ],
        },
        controlled: true,
        result: { remove: true },
        renderTile: (id, path) => <GripWindow id={id} path={path} />,
      });
      await flush();

      await dragToOutside(container, grip(container, 'c'));

      expect(onChange).toHaveBeenLastCalledWith(
        expect.objectContaining({
          children: [
            'a',
            expect.objectContaining({ type: 'tabs', tabs: ['b', 'd'] }),
          ],
        }),
      );
    });

    it('removes the dragged window after the parent restructured the tree', async () => {
      const { container, onChange, parent } = setup({
        initial: {
          type: 'split',
          direction: 'row',
          children: [
            'x',
            { type: 'split', direction: 'column', children: ['b', 'c'] },
          ],
        },
        controlled: true,
        result: { remove: true },
      });
      await flush();

      await dragToOutside(container, windowTitle(container, 'c'), () =>
        parent.setValue?.({
          type: 'split',
          direction: 'row',
          children: [
            'c',
            { type: 'split', direction: 'column', children: ['x', 'b'] },
          ],
        }),
      );

      expect(onChange).toHaveBeenLastCalledWith(
        expect.objectContaining({ type: 'split', children: ['x', 'b'] }),
      );
      expect(renderedTitles(container)).toEqual(['b', 'x']);
    });

    it("doesn't throw when the drag-start path no longer exists", async () => {
      const { container, onChange, parent } = setup({
        initial: {
          type: 'split',
          direction: 'row',
          children: [
            'x',
            { type: 'split', direction: 'column', children: ['b', 'c'] },
          ],
        },
        controlled: true,
        result: { remove: true },
      });
      await flush();

      await dragToOutside(container, windowTitle(container, 'c'), () =>
        parent.setValue?.({
          type: 'split',
          direction: 'row',
          children: ['c', 'x'],
        }),
      );

      expect(onChange).toHaveBeenLastCalledWith('x');
      expect(renderedTitles(container)).toEqual(['x']);
    });
  });
});
