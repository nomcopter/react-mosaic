import React, { useContext } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, render } from '@testing-library/react';

import { Mosaic } from './Mosaic';
import { MosaicContext, MosaicRootActions } from './contextTypes';
import { MosaicNode } from './types';

const TWO_LEAF_TREE: MosaicNode<string> = {
  type: 'split',
  direction: 'row',
  children: ['a', 'b'],
};

const TABS_TREE: MosaicNode<string> = {
  type: 'tabs',
  tabs: ['a', 'b', 'c'],
  activeTabIndex: 0,
};

describe('Mosaic drag lifecycle callbacks', () => {
  let capturedActions: MosaicRootActions<string> | undefined;

  function CaptureActions() {
    capturedActions = useContext(MosaicContext)
      .mosaicActions as MosaicRootActions<string>;
    return null;
  }

  beforeEach(() => {
    capturedActions = undefined;
  });

  afterEach(() => {
    cleanup();
  });

  it('does not fire onRelease when a drag begins (source is hidden)', () => {
    const onChange = vi.fn();
    const onRelease = vi.fn();

    render(
      <Mosaic<string>
        initialValue={TWO_LEAF_TREE}
        onChange={onChange}
        onRelease={onRelease}
        renderTile={() => <CaptureActions />}
      />,
    );

    expect(capturedActions).toBeDefined();

    // react-dnd calls mosaicActions.hide(sourcePath) at the *start* of a drag.
    // This is a transient, in-progress change: onChange should fire so the
    // source tile visually collapses, but onRelease must NOT fire yet — the
    // user has not released anything.
    act(() => {
      capturedActions!.hide([0]);
    });

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onRelease).not.toHaveBeenCalled();
  });

  it('does not fire onRelease when a drag is cancelled (source is restored)', () => {
    const onChange = vi.fn();
    const onRelease = vi.fn();

    render(
      <Mosaic<string>
        initialValue={TWO_LEAF_TREE}
        onChange={onChange}
        onRelease={onRelease}
        renderTile={() => <CaptureActions />}
      />,
    );

    expect(capturedActions).toBeDefined();

    // A cancelled drag: react-dnd hides the source on drag start, then calls
    // mosaicActions.show(sourcePath, true) to restore it when the drop is
    // aborted. Nothing was committed, so onRelease must never fire across the
    // whole cancelled interaction.
    act(() => {
      capturedActions!.hide([0]);
    });
    act(() => {
      capturedActions!.show([0], true);
    });

    expect(onRelease).not.toHaveBeenCalled();
  });

  it('fires onRelease only on commit when reordering tabs by drag', () => {
    const onChange = vi.fn();
    const onRelease = vi.fn();

    render(
      <Mosaic<string>
        initialValue={TABS_TREE}
        onChange={onChange}
        onRelease={onRelease}
        renderTile={() => <CaptureActions />}
      />,
    );

    expect(capturedActions).toBeDefined();

    // Drag start on a tab hides it (react-dnd calls hide(tabPath, true), which
    // switches the active tab). Transient — onRelease must not fire yet.
    act(() => {
      capturedActions!.hide([0], true);
    });
    expect(onRelease).not.toHaveBeenCalled();

    // Dropping the tab commits the reorder via updateTree — this is the actual
    // release, so onRelease fires exactly once, for the committed tree.
    act(() => {
      capturedActions!.updateTree([
        {
          path: [],
          spec: {
            tabs: { $set: ['b', 'a', 'c'] },
            activeTabIndex: { $set: 1 },
          },
        },
      ]);
    });
    expect(onRelease).toHaveBeenCalledTimes(1);
  });
});
