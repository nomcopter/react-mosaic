import React from 'react';
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

function renderUncontrolled(initial: MosaicNode<string>) {
  const onChange = vi.fn();
  const onRelease = vi.fn();
  const utils = render(
    <Mosaic<string>
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
