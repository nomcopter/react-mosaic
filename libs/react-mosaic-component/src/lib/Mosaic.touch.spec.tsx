import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render } from '@testing-library/react';

import { Mosaic } from './Mosaic';
import { MosaicWindow } from './MosaicWindow';
import { MosaicNode } from './types';

// Touch interactions go through the real multi-backend: the first touchstart
// switches it from the HTML5 backend to the touch backend, which then finds
// drop targets with document.elementsFromPoint. jsdom does no hit testing, so
// the element "under the finger" is set explicitly by each gesture.
let elementUnderFinger: Element | null = null;

function touchAt(x: number, y: number) {
  const touch = { clientX: x, clientY: y, identifier: 0 };
  return { touches: [touch], targetTouches: [touch], changedTouches: [touch] };
}

function liftAt(x: number, y: number) {
  const touch = { clientX: x, clientY: y, identifier: 0 };
  return { touches: [], targetTouches: [], changedTouches: [touch] };
}

const flush = () =>
  act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 10));
  });

async function touchDrag(source: Element, target: Element) {
  elementUnderFinger = source;
  fireEvent.touchStart(source, touchAt(10, 10));
  await flush();
  elementUnderFinger = target;
  fireEvent.touchMove(target, touchAt(40, 40));
  await flush();
  fireEvent.touchMove(target, touchAt(41, 41));
  await flush();
  fireEvent.touchEnd(target, liftAt(41, 41));
  await flush();
}

function query(root: ParentNode, selector: string): Element {
  const element = root.querySelector(selector);
  if (element == null) {
    throw new Error(`No element matches ${selector}`);
  }
  return element;
}

function windowTitled(container: HTMLElement, title: string): Element {
  const titleElement = [
    ...container.querySelectorAll('.mosaic-root .mosaic-window-title'),
  ].find((element) => element.textContent === title);
  const windowElement = titleElement?.closest('.mosaic-window');
  if (windowElement == null) {
    throw new Error(`No window titled ${title}`);
  }
  return windowElement;
}

function renderControlled(initial: MosaicNode<string>) {
  let latest: MosaicNode<string> | null = initial;
  const onRelease = vi.fn();

  function App() {
    const [value, setValue] = React.useState<MosaicNode<string> | null>(
      initial,
    );
    return (
      <Mosaic<string>
        value={value}
        onChange={(next) => {
          latest = next;
          setValue(next);
        }}
        onRelease={onRelease}
        renderTile={(id, path) => (
          <MosaicWindow<string> path={path} title={id}>
            <div>{id}</div>
          </MosaicWindow>
        )}
      />
    );
  }

  const utils = render(<App />);
  return { ...utils, onRelease, latest: () => latest };
}

describe('Mosaic touch interactions', () => {
  beforeEach(() => {
    elementUnderFinger = null;
    document.elementsFromPoint = () =>
      elementUnderFinger ? [elementUnderFinger] : [];
    document.elementFromPoint = () => elementUnderFinger;
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('drags a window onto the edge of another window', async () => {
    const { container, latest, onRelease } = renderControlled({
      type: 'split',
      direction: 'row',
      children: ['a', 'b', 'c'],
    });
    await flush();

    await touchDrag(
      query(windowTitled(container, 'c'), '.mosaic-window-title'),
      query(windowTitled(container, 'a'), '.drop-target.bottom'),
    );

    expect(latest()).toEqual(
      expect.objectContaining({
        type: 'split',
        direction: 'row',
        children: [
          expect.objectContaining({
            type: 'split',
            direction: 'column',
            children: ['a', 'c'],
          }),
          'b',
        ],
      }),
    );
    expect(onRelease).toHaveBeenCalledTimes(1);
  });

  it('drags a window onto the root edge', async () => {
    const { container, latest } = renderControlled({
      type: 'split',
      direction: 'row',
      children: ['a', 'b', 'c'],
    });
    await flush();

    await touchDrag(
      query(windowTitled(container, 'a'), '.mosaic-window-title'),
      query(container, '.mosaic > .drop-target-container .drop-target.right'),
    );

    expect(latest()).toEqual(
      expect.objectContaining({ children: ['b', 'c', 'a'] }),
    );
  });

  it('puts the window back when the finger is lifted outside any target', async () => {
    const initial: MosaicNode<string> = {
      type: 'split',
      direction: 'row',
      children: ['a', 'b'],
      splitPercentages: [30, 70],
    };
    const { container, latest, onRelease } = renderControlled(initial);
    await flush();

    await touchDrag(
      query(windowTitled(container, 'a'), '.mosaic-window-title'),
      document.body,
    );

    expect(latest()).toEqual(initial);
    expect(onRelease).not.toHaveBeenCalled();
  });

  it('reorders tabs by dragging a tab', async () => {
    const { container, latest } = renderControlled({
      type: 'tabs',
      tabs: ['a', 'b', 'c'],
      activeTabIndex: 0,
    });
    await flush();

    const tabBar = query(container, '.mosaic-tabs-container > .mosaic-tab-bar');
    const dropTargets = tabBar.querySelectorAll('.tab-drop-target');
    await touchDrag(
      query(tabBar, '.mosaic-tab-button[title="a"]'),
      dropTargets[dropTargets.length - 1],
    );

    expect(latest()).toEqual(
      expect.objectContaining({ type: 'tabs', tabs: ['b', 'c', 'a'] }),
    );
  });

  it('drags a tab out of its group onto a window edge', async () => {
    const { container, latest } = renderControlled({
      type: 'split',
      direction: 'row',
      children: ['x', { type: 'tabs', tabs: ['a', 'b'], activeTabIndex: 0 }],
    });
    await flush();

    await touchDrag(
      query(container, '.mosaic-tab-button[title="b"]'),
      query(windowTitled(container, 'x'), '.drop-target.bottom'),
    );

    expect(latest()).toEqual(
      expect.objectContaining({
        children: [
          expect.objectContaining({
            direction: 'column',
            children: ['x', 'b'],
          }),
          'a',
        ],
      }),
    );
  });

  it('resizes a split by dragging the divider', async () => {
    const { container, latest, onRelease } = renderControlled({
      type: 'split',
      direction: 'row',
      children: ['a', 'b'],
    });
    await flush();

    const root = query(container, '.mosaic-root');
    vi.spyOn(root, 'getBoundingClientRect').mockReturnValue({
      x: 0,
      y: 0,
      left: 0,
      top: 0,
      right: 1000,
      bottom: 500,
      width: 1000,
      height: 500,
      toJSON: () => ({}),
    });
    const divider = query(container, '.mosaic-split');

    fireEvent.touchStart(divider, touchAt(500, 100));
    fireEvent.touchMove(document, touchAt(700, 100));
    await flush();
    fireEvent.touchEnd(document, liftAt(700, 100));
    await flush();

    expect(latest()).toEqual(
      expect.objectContaining({ splitPercentages: [70, 30] }),
    );
    expect(onRelease).toHaveBeenCalledTimes(1);
  });

  it('runs toolbar buttons on tap without starting a drag', async () => {
    const { container, latest } = renderControlled({
      type: 'split',
      direction: 'row',
      children: ['a', 'b'],
    });
    await flush();

    const expand = query(windowTitled(container, 'a'), '.expand-button');
    elementUnderFinger = expand;
    fireEvent.touchStart(expand, touchAt(5, 5));
    fireEvent.touchEnd(expand, liftAt(5, 5));
    fireEvent.click(expand);
    await flush();

    expect(latest()).toEqual(
      expect.objectContaining({ splitPercentages: [70, 30] }),
    );

    const remove = query(windowTitled(container, 'b'), '.close-button');
    elementUnderFinger = remove;
    fireEvent.touchStart(remove, touchAt(5, 5));
    fireEvent.touchEnd(remove, liftAt(5, 5));
    fireEvent.click(remove);
    await flush();

    expect(latest()).toEqual('a');
  });

  it('selects a tab on tap', async () => {
    const { container, latest } = renderControlled({
      type: 'tabs',
      tabs: ['a', 'b', 'c'],
      activeTabIndex: 0,
    });
    await flush();

    const tabB = query(
      container,
      '.mosaic-tabs-container > .mosaic-tab-bar .mosaic-tab-button[title="b"]',
    );
    elementUnderFinger = tabB;
    fireEvent.touchStart(tabB, touchAt(5, 5));
    fireEvent.touchEnd(tabB, liftAt(5, 5));
    fireEvent.click(tabB);
    await flush();

    expect(latest()).toEqual(
      expect.objectContaining({ tabs: ['a', 'b', 'c'], activeTabIndex: 1 }),
    );
  });
});
