import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render } from '@testing-library/react';

import { Mosaic } from './Mosaic';
import { MosaicWindow } from './MosaicWindow';
import { MosaicNode, TabButtonRenderer, TabTitleRenderer } from './types';

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

const flush = () =>
  act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 10));
  });

// Starts a drag on `source`, lets the drag-start hide run, then drops on
// `target` or, without one, ends the drag without dropping.
async function drag(source: Element, target?: Element) {
  const dataTransfer = createDataTransfer();
  fireEvent.dragStart(source, { dataTransfer });
  await flush();
  if (target) {
    fireEvent.dragEnter(target, { dataTransfer });
    fireEvent.dragOver(target, { dataTransfer });
    fireEvent.drop(target, { dataTransfer });
  }
  fireEvent.dragEnd(source, { dataTransfer });
  await flush();
}

function renderUncontrolled(
  initial: MosaicNode<string>,
  tabProps: {
    renderTabTitle?: TabTitleRenderer<string>;
    renderTabButton?: TabButtonRenderer<string>;
  } = {},
) {
  const onChange = vi.fn();
  const onRelease = vi.fn();
  const utils = render(
    <Mosaic<string>
      {...tabProps}
      initialValue={initial}
      onChange={onChange}
      onRelease={onRelease}
      renderTile={(id, path) => (
        <MosaicWindow<string> title={id} path={path}>
          {id}
        </MosaicWindow>
      )}
    />,
  );
  const tabBar = () =>
    utils.container.querySelector('.mosaic-tab-bar-tabs') as HTMLElement;
  const tab = (key: string): Element => {
    const match = tabBar().querySelector(`.mosaic-tab-button[title="${key}"]`);
    if (match == null) {
      throw new Error(`No tab ${key}`);
    }
    return match;
  };
  // The strip's insert slots, in order: before the first tab, after each tab
  const slot = (index: number): Element =>
    tabBar().querySelectorAll('.tab-drop-target')[index];
  const activeTab = () =>
    tabBar().querySelector('.mosaic-tab-button.-active')?.getAttribute('title');
  const tabOrder = () =>
    Array.from(tabBar().querySelectorAll('.mosaic-tab-button')).map((t) =>
      t.getAttribute('title'),
    );
  return { ...utils, onChange, onRelease, tab, slot, activeTab, tabOrder };
}

const THREE_TABS: MosaicNode<string> = {
  type: 'split',
  direction: 'row',
  children: ['a', { type: 'tabs', tabs: ['b', 'c', 'd'], activeTabIndex: 0 }],
};

describe('DraggableTab: the active tab across a tab drag', () => {
  afterEach(() => {
    cleanup();
  });

  it('a cancelled drag of the active tab keeps it active', async () => {
    const { tab, activeTab, tabOrder, onRelease } =
      renderUncontrolled(THREE_TABS);
    await flush();

    await drag(tab('b'));

    expect(tabOrder()).toEqual(['b', 'c', 'd']);
    expect(activeTab()).toBe('b');
    expect(onRelease).not.toHaveBeenCalled();
  });

  it('dropping the active tab back on the tab bar keeps it active', async () => {
    const { container, tab, activeTab, tabOrder } =
      renderUncontrolled(THREE_TABS);
    await flush();

    const tabBar = container.querySelector('.mosaic-tab-bar');
    if (tabBar == null) {
      throw new Error('No tab bar');
    }
    await drag(tab('b'), tabBar);

    expect(tabOrder()).toEqual(['b', 'c', 'd']);
    expect(activeTab()).toBe('b');
  });

  it.each([0, 1])(
    'dropping the active tab on its own slot (%i) keeps it active',
    async (index) => {
      const { tab, slot, activeTab, tabOrder, onRelease } =
        renderUncontrolled(THREE_TABS);
      await flush();

      await drag(tab('b'), slot(index));

      expect(tabOrder()).toEqual(['b', 'c', 'd']);
      expect(activeTab()).toBe('b');
      expect(onRelease).toHaveBeenLastCalledWith(
        THREE_TABS,
        expect.objectContaining({ type: 'drop' }),
      );
    },
  );

  it('moving the active tab keeps it active at its new position', async () => {
    const { tab, slot, activeTab, tabOrder, onRelease } =
      renderUncontrolled(THREE_TABS);
    await flush();

    await drag(tab('b'), slot(3));

    expect(tabOrder()).toEqual(['c', 'd', 'b']);
    expect(activeTab()).toBe('b');
    expect(onRelease).toHaveBeenLastCalledWith(
      {
        ...THREE_TABS,
        children: [
          'a',
          { type: 'tabs', tabs: ['c', 'd', 'b'], activeTabIndex: 2 },
        ],
      },
      expect.objectContaining({ type: 'drop' }),
    );
  });

  it('moving a background tab keeps the active tab', async () => {
    const { tab, slot, activeTab, tabOrder } = renderUncontrolled(THREE_TABS);
    await flush();

    await drag(tab('d'), slot(0));

    expect(tabOrder()).toEqual(['d', 'b', 'c']);
    expect(activeTab()).toBe('b');
  });

  it('a cancelled drag in a single-tab group leaves the group as it was', async () => {
    const single: MosaicNode<string> = {
      type: 'split',
      direction: 'row',
      children: ['a', { type: 'tabs', tabs: ['b'], activeTabIndex: 0 }],
    };
    const { tab, activeTab, tabOrder, onChange } = renderUncontrolled(single);
    await flush();

    const dataTransfer = createDataTransfer();
    fireEvent.dragStart(tab('b'), { dataTransfer });
    await flush();
    // The drag started instead of throwing in the drag-start hide
    expect(tab('b').classList.contains('-dragging')).toBe(true);
    fireEvent.dragEnd(tab('b'), { dataTransfer });
    await flush();

    expect(tabOrder()).toEqual(['b']);
    expect(activeTab()).toBe('b');
    expect(onChange).not.toHaveBeenCalled();
  });
});

// Starts a drag the way a browser does, mouse down first, and records what
// the HTML5 backend hands to setDragImage and whether it was shown then
function startDrag(source: Element) {
  const snapshots: { node: Element; shown: boolean }[] = [];
  const dataTransfer = {
    ...createDataTransfer(),
    setDragImage: (node: Element) => {
      snapshots.push({ node, shown: node.classList.contains('-drag-image') });
    },
  };
  fireEvent.mouseDown(source);
  fireEvent.dragStart(source, { dataTransfer });
  return {
    snapshots,
    end: async () => {
      await flush();
      fireEvent.dragEnd(source, { dataTransfer });
      await flush();
    },
  };
}

async function dragImageTitle(source: Element): Promise<string | undefined> {
  const { snapshots, end } = startDrag(source);
  await end();
  expect(snapshots).toHaveLength(1);
  return (
    snapshots[0].node.querySelector('.mosaic-window-title')?.textContent ??
    undefined
  );
}

describe('DraggableTab: the drag image', () => {
  afterEach(() => {
    cleanup();
  });

  it('is the window card, shown just for the dragstart snapshot', async () => {
    const { tab } = renderUncontrolled(THREE_TABS);
    await flush();

    const { snapshots, end } = startDrag(tab('c'));
    await flush();

    expect(snapshots).toHaveLength(1);
    const { node, shown } = snapshots[0];
    expect(node.classList.contains('mosaic-preview')).toBe(true);
    expect(node.querySelector('.mosaic-window-title')?.textContent).toBe(
      'Tab c',
    );
    expect(shown).toBe(true);
    expect(node.classList.contains('-drag-image')).toBe(false);
    await end();
  });

  it('shows a custom tab title', async () => {
    const { tab } = renderUncontrolled(THREE_TABS, {
      renderTabTitle: ({ tabKey }) => <b>Custom {tabKey}</b>,
    });
    await flush();

    expect(await dragImageTitle(tab('d'))).toBe('Custom d');
  });

  it('follows the dragged tab, also after a reorder', async () => {
    const { tab, slot, tabOrder } = renderUncontrolled(THREE_TABS);
    await flush();

    expect(await dragImageTitle(tab('c'))).toBe('Tab c');
    expect(await dragImageTitle(tab('d'))).toBe('Tab d');

    fireEvent.mouseDown(tab('d'));
    await drag(tab('d'), slot(0));
    expect(tabOrder()).toEqual(['d', 'b', 'c']);

    expect(await dragImageTitle(tab('c'))).toBe('Tab c');
    expect(await dragImageTitle(tab('d'))).toBe('Tab d');
  });

  it('works for a single-tab group', async () => {
    const { tab } = renderUncontrolled({
      type: 'split',
      direction: 'row',
      children: ['a', { type: 'tabs', tabs: ['b'], activeTabIndex: 0 }],
    });
    await flush();

    expect(await dragImageTitle(tab('b'))).toBe('Tab b');
  });

  it('works for a deeply nested group', async () => {
    const { tab } = renderUncontrolled({
      type: 'split',
      direction: 'row',
      children: [
        'a',
        {
          type: 'split',
          direction: 'column',
          children: [
            'x',
            {
              type: 'split',
              direction: 'row',
              children: [
                'y',
                { type: 'tabs', tabs: ['p', 'q'], activeTabIndex: 1 },
              ],
            },
          ],
        },
      ],
    });
    await flush();

    expect(await dragImageTitle(tab('p'))).toBe('Tab p');
  });

  it('is not rendered for custom tab buttons', async () => {
    const { container } = renderUncontrolled(THREE_TABS, {
      renderTabButton: ({ tabKey, onTabClick }) => (
        <button
          className="mosaic-tab-button"
          title={tabKey}
          onClick={onTabClick}
        >
          {tabKey}
        </button>
      ),
    });
    await flush();

    expect(
      container.querySelector('.mosaic-tabs-container > .mosaic-preview.-tab'),
    ).toBeNull();
  });

  it('of the whole group is shown just for the dragstart snapshot', async () => {
    const { container } = renderUncontrolled(THREE_TABS);
    await flush();

    const handle = container.querySelector('.mosaic-tab-drag-button');
    if (handle == null) {
      throw new Error('No tab group drag handle');
    }
    const { snapshots, end } = startDrag(handle);
    await flush();

    expect(snapshots).toHaveLength(1);
    const { node, shown } = snapshots[0];
    expect(node.matches('.mosaic-tabs-container > .mosaic-preview')).toBe(true);
    expect(node.classList.contains('-tab')).toBe(false);
    expect(shown).toBe(true);
    expect(node.classList.contains('-drag-image')).toBe(false);
    await end();
  });
});
