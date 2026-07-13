import React, { Profiler, useContext, useEffect } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render } from '@testing-library/react';

import { Mosaic } from './Mosaic';
import { MosaicContext, MosaicRootActions } from './contextTypes';
import { Split } from './Split';
import { LegacyMosaicNode, MosaicNode } from './types';

// Rendering-performance characterization.
//
// These tests pin rendering behavior with hard numbers (render counts, mount
// counts, commit counts, reference identity). The "baseline" suite documents
// the known full-tree rendering cost that is deliberately not optimized (no
// component memoization by project decision); the remaining suites are
// regression locks for implemented fixes: throttle cancellation on release,
// stable custom-toolbar component identity, cached + emitted legacy
// conversion, and intrinsic tab-group keys.

// a | (b / c) | d — the middle child is a nested column so we can prove that
// updates re-render subtrees they cannot possibly affect.
const NESTED_TREE: MosaicNode<string> = {
  type: 'split',
  direction: 'row',
  children: [
    'a',
    { type: 'split', direction: 'column', children: ['b', 'c'] },
    'd',
  ],
};

const MODERN_TWO_LEAF: MosaicNode<string> = {
  type: 'split',
  direction: 'row',
  children: ['a', 'b'],
};

const LEGACY_TWO_LEAF: LegacyMosaicNode<string> = {
  direction: 'row',
  first: 'a',
  second: 'b',
};

const TABS_TREE: MosaicNode<string> = {
  type: 'tabs',
  tabs: ['a', 'b', 'c'],
  activeTabIndex: 0,
};

const TABS_IN_SPLIT: MosaicNode<string> = {
  type: 'split',
  direction: 'row',
  children: [{ type: 'tabs', tabs: ['a', 'b'], activeTabIndex: 0 }, 'x'],
};

let capturedActions: MosaicRootActions<string> | undefined;
let renderCounts: Record<string, number>;
let mountCounts: Record<string, number>;
let commits: number;

function Tile({ id }: { id: string }) {
  capturedActions = useContext(MosaicContext)
    .mosaicActions as MosaicRootActions<string>;
  renderCounts[id] = (renderCounts[id] ?? 0) + 1;
  useEffect(() => {
    mountCounts[id] = (mountCounts[id] ?? 0) + 1;
  }, []);
  return <div data-testid={`tile-${id}`}>{id}</div>;
}

const renderTile = (id: string) => <Tile id={id} />;

function resetCounts() {
  renderCounts = {};
  mountCounts = {};
  commits = 0;
}

const onCommit = () => {
  commits++;
};

// jsdom reports zero-sized rects; Split converts mouse position to
// percentages via the parent rect, so give it a deterministic 1000×1000 box.
function mockElementRect() {
  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue({
    width: 1000,
    height: 1000,
    top: 0,
    left: 0,
    right: 1000,
    bottom: 1000,
    x: 0,
    y: 0,
    toJSON: () => ({}),
  } as DOMRect);
}

beforeEach(() => {
  capturedActions = undefined;
  resetCounts();
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('baseline: full-tree rendering on every update', () => {
  it('a single splitPercentages update re-renders every tile, including untouched subtrees', () => {
    render(
      <Profiler id="mosaic" onRender={onCommit}>
        <Mosaic<string> initialValue={NESTED_TREE} renderTile={renderTile} />
      </Profiler>,
    );
    expect(capturedActions).toBeDefined();
    resetCounts();

    // Redistribute space between children 0 and 1 only — child 2 ('d') and the
    // nested column ('b', 'c') keep their node identity, paths, and bounding
    // boxes, so ideally none of them would render.
    act(() => {
      capturedActions!.updateTree([
        { path: [], spec: { splitPercentages: { $set: [40, 40, 20] } } },
      ]);
    });

    expect(commits).toBe(1);
    // Baseline: every tile renders once per commit. With subtree bail-outs
    // (not currently planned) 'b', 'c', 'd' would drop to 0.
    expect(renderCounts).toEqual({ a: 1, b: 1, c: 1, d: 1 });
    // Re-renders, not remounts — keys are stable when the shape is unchanged.
    expect(mountCounts).toEqual({});
  });

  it('each throttled drag-resize onChange re-renders every tile', async () => {
    mockElementRect();
    const onChange = vi.fn();
    const onRelease = vi.fn();
    const { container } = render(
      <Mosaic<string>
        initialValue={NESTED_TREE}
        onChange={onChange}
        onRelease={onRelease}
        renderTile={renderTile}
      />,
    );
    // First splitter in DOM order is the root row's splitter between 'a' and
    // the nested column.
    const splitter = container.querySelectorAll('.mosaic-split')[0];
    expect(splitter).toBeDefined();
    resetCounts();

    fireEvent.mouseDown(splitter, { button: 0 });
    // The 30fps throttle is leading-edge, so the first move commits a tree
    // update synchronously.
    fireEvent.mouseMove(document, { clientX: 450, clientY: 100 });

    expect(onChange).toHaveBeenCalledTimes(1);
    // Baseline: one mouse-move = one full-tree render. 'd' is at the same
    // position with the same bounding box before and after, yet re-renders.
    // During a real drag this happens ~30×/second.
    expect(renderCounts).toEqual({ a: 1, b: 1, c: 1, d: 1 });

    fireEvent.mouseUp(document, { clientX: 450, clientY: 100 });
    expect(onRelease).toHaveBeenCalledTimes(1);
  });
});

describe('legacy tree conversion in controlled mode', () => {
  it('controlled legacy value: converted once, getRoot() is identity-stable', () => {
    render(
      <Mosaic<string>
        value={LEGACY_TWO_LEAF}
        onChange={() => void 0}
        renderTile={renderTile}
      />,
    );
    expect(capturedActions).toBeDefined();

    const first = capturedActions!.getRoot();
    const second = capturedActions!.getRoot();

    expect(first).toEqual({
      type: 'split',
      direction: 'row',
      children: ['a', 'b'],
      splitPercentages: undefined,
    });
    // The conversion is cached by value reference — getRoot() is called
    // several times per window per render and must not allocate each time.
    expect(second).toBe(first);
  });

  it('controlled legacy value: reports the converted tree through onChange once so the caller can migrate', () => {
    const onChange = vi.fn();
    const onRelease = vi.fn();
    const { rerender } = render(
      <Mosaic<string>
        value={LEGACY_TWO_LEAF}
        onChange={onChange}
        onRelease={onRelease}
        renderTile={renderTile}
      />,
    );

    // Migration event: the converted tree is handed to the caller exactly
    // once, and it is the same object getRoot() serves…
    expect(onChange).toHaveBeenCalledTimes(1);
    const migrated = onChange.mock.calls[0][0];
    expect(migrated).toBe(capturedActions!.getRoot());
    // …and it is not a user gesture, so onRelease must not fire.
    expect(onRelease).not.toHaveBeenCalled();

    // Same legacy reference again: no re-emit — a caller that ignores the
    // emit is neither spammed nor able to loop.
    rerender(
      <Mosaic<string>
        value={LEGACY_TWO_LEAF}
        onChange={onChange}
        onRelease={onRelease}
        renderTile={renderTile}
      />,
    );
    expect(onChange).toHaveBeenCalledTimes(1);

    // Caller adopts the emitted tree: no further emits, identity preserved.
    rerender(
      <Mosaic<string>
        value={migrated}
        onChange={onChange}
        onRelease={onRelease}
        renderTile={renderTile}
      />,
    );
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(capturedActions!.getRoot()).toBe(migrated);
  });

  it('controlled modern value: getRoot() is identity-stable and no migration onChange fires', () => {
    const onChange = vi.fn();
    render(
      <Mosaic<string>
        value={MODERN_TWO_LEAF}
        onChange={onChange}
        renderTile={renderTile}
      />,
    );
    expect(capturedActions).toBeDefined();

    // convertLegacyToNary returns non-legacy input by reference; this guards
    // the fast path the cache and migration emit must preserve.
    expect(capturedActions!.getRoot()).toBe(capturedActions!.getRoot());
    expect(capturedActions!.getRoot()).toBe(MODERN_TWO_LEAF);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('uncontrolled legacy initialValue: converted once into state, identity-stable', () => {
    render(
      <Mosaic<string> initialValue={LEGACY_TWO_LEAF} renderTile={renderTile} />,
    );
    expect(capturedActions).toBeDefined();

    expect(capturedActions!.getRoot()).toBe(capturedActions!.getRoot());
  });
});

describe('custom tab toolbar identity', () => {
  it('the DraggableTab handed to renderTabToolbar keeps its component type across updates — no remount', () => {
    let toolbarMounts = 0;
    function ToolbarProbe() {
      useEffect(() => {
        toolbarMounts++;
      }, []);
      return <span>probe</span>;
    }

    render(
      <Mosaic<string>
        initialValue={TABS_TREE}
        renderTile={renderTile}
        renderTabToolbar={({ DraggableTab }) => (
          <DraggableTab tabKey="a" tabIndex={0}>
            {() => <ToolbarProbe />}
          </DraggableTab>
        )}
      />,
    );
    expect(toolbarMounts).toBe(1);

    // The wrapper is a module-level component with a stable element type, so
    // a tree update re-renders the toolbar subtree in place instead of
    // unmounting and remounting it (which would lose state and rebuild DOM).
    act(() => {
      capturedActions!.updateTree([
        { path: [], spec: { activeTabIndex: { $set: 1 } } },
      ]);
    });

    expect(toolbarMounts).toBe(1);
  });
});

describe('intrinsic keys for tab groups', () => {
  it('inserting a sibling does not remount the tab group or leaf tiles', () => {
    render(
      <Mosaic<string> initialValue={TABS_IN_SPLIT} renderTile={renderTile} />,
    );
    expect(mountCounts).toEqual({ a: 1, x: 1 });

    // Insert 'y' before the tab group: the group shifts from flattened index
    // 0 to 2, but its key is derived from its own tabs, not its position.
    act(() => {
      capturedActions!.updateTree([
        { path: [], spec: { children: { $splice: [[0, 0, 'y']] } } },
      ]);
    });

    // Leaf tiles carry their own stable key (the node value) and survive.
    expect(mountCounts['x']).toBe(1);
    // The tab group keeps its intrinsic key, so the active tile's DOM and
    // local state survive the structural change.
    expect(mountCounts['a']).toBe(1);
    expect(mountCounts['y']).toBe(1);
  });

  it('reordering tabs within a group does not remount it', () => {
    render(
      <Mosaic<string> initialValue={TABS_IN_SPLIT} renderTile={renderTile} />,
    );
    expect(mountCounts['a']).toBe(1);

    // Reverse the tab order, keeping 'a' active (now at index 1). The group's
    // key is reorder-independent (smallest tab key), so nothing remounts.
    act(() => {
      capturedActions!.updateTree([
        {
          path: [0],
          spec: {
            tabs: { $set: ['b', 'a'] },
            activeTabIndex: { $set: 1 },
          },
        },
      ]);
    });

    expect(mountCounts['a']).toBe(1);
  });
});

describe('Split resize callback ordering', () => {
  // Regression lock: Split cancels the throttle's queued trailing call on
  // mouseup, so no onChange can be delivered after onRelease.
  it('does not deliver a throttled onChange after onRelease', async () => {
    mockElementRect();
    const order: string[] = [];
    render(
      <Split
        direction="row"
        boundingBox={{ top: 0, right: 0, bottom: 0, left: 0 }}
        splitPercentages={[50, 50]}
        splitIndex={0}
        onChange={() => order.push('change')}
        onRelease={() => order.push('release')}
      />,
    );
    const splitter = document.querySelector('.mosaic-split');
    expect(splitter).not.toBeNull();

    fireEvent.mouseDown(splitter!, { button: 0 });
    // Leading edge fires immediately…
    fireEvent.mouseMove(document, { clientX: 600, clientY: 100 });
    // …second move inside the 33ms window queues a trailing call…
    fireEvent.mouseMove(document, { clientX: 610, clientY: 100 });
    // …which releasing must cancel.
    fireEvent.mouseUp(document, { clientX: 620, clientY: 100 });

    await new Promise((resolve) => setTimeout(resolve, 60));

    expect(order).toEqual(['change', 'release']);
  });
});
