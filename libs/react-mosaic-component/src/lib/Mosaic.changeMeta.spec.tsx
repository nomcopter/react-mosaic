import React, { useContext } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';

import { MosaicContext, MosaicRootActions } from './contextTypes';
import { Mosaic } from './Mosaic';
import { MosaicWindow } from './MosaicWindow';
import { LegacyMosaicNode, MosaicChangeMeta, MosaicNode } from './types';

const NESTED_TREE: MosaicNode<string> = {
  type: 'split',
  direction: 'row',
  splitPercentages: [50, 50],
  children: [
    'a',
    {
      type: 'split',
      direction: 'column',
      splitPercentages: [50, 50],
      children: ['b', 'c'],
    },
  ],
};

const TABS_TREE: MosaicNode<string> = {
  type: 'tabs',
  tabs: ['a', 'b', 'c'],
  activeTabIndex: 0,
};

let actions: MosaicRootActions<string> | undefined;

function CaptureActions() {
  actions = useContext(MosaicContext)
    .mosaicActions as MosaicRootActions<string>;
  return null;
}

function renderWindow(id: string, path: number[]) {
  return (
    <MosaicWindow<string> path={path} title={id}>
      <CaptureActions />
      {id}
    </MosaicWindow>
  );
}

function lastMeta(fn: ReturnType<typeof vi.fn>): MosaicChangeMeta<string> {
  return fn.mock.calls[fn.mock.calls.length - 1][1];
}

beforeEach(() => {
  actions = undefined;
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('onChange / onRelease meta', () => {
  it('reports the removed subtree for the remove button in a nested tree', () => {
    const onChange = vi.fn();
    const onRelease = vi.fn();
    render(
      <Mosaic<string>
        initialValue={NESTED_TREE}
        onChange={onChange}
        onRelease={onRelease}
        renderTile={renderWindow}
      />,
    );

    const closeButtons = screen.getAllByTitle('Close Window');
    // Tiles render in tree order: a, b, c
    fireEvent.click(closeButtons[1]);

    const expected: MosaicChangeMeta<string> = {
      type: 'remove',
      path: [1, 0],
      node: 'b',
    };
    expect(lastMeta(onChange)).toEqual(expected);
    expect(lastMeta(onRelease)).toEqual(expected);
  });

  it('reports removing a subtree and the only node of a single-node tree', () => {
    const onChange = vi.fn();
    const { unmount } = render(
      <Mosaic<string>
        initialValue={NESTED_TREE}
        onChange={onChange}
        renderTile={renderWindow}
      />,
    );
    act(() => actions!.remove([1]));
    expect(lastMeta(onChange)).toEqual({
      type: 'remove',
      path: [1],
      node: (NESTED_TREE as { children: MosaicNode<string>[] }).children[1],
    });
    unmount();

    render(
      <Mosaic<string>
        initialValue="solo"
        onChange={onChange}
        renderTile={renderWindow}
      />,
    );
    act(() => actions!.remove([]));
    expect(onChange).toHaveBeenLastCalledWith(null, {
      type: 'remove',
      path: [],
      node: 'solo',
    });
  });

  it('reports replace from the zero state of an empty tree', async () => {
    const onChange = vi.fn();
    function ZeroState() {
      const { mosaicActions } = useContext(MosaicContext);
      return (
        <button onClick={() => mosaicActions.replaceWith([], 'first')}>
          create
        </button>
      );
    }
    render(
      <Mosaic<string>
        value={null}
        onChange={onChange}
        zeroStateView={<ZeroState />}
        renderTile={renderWindow}
      />,
    );

    fireEvent.click(screen.getByText('create'));

    expect(onChange).toHaveBeenLastCalledWith('first', {
      type: 'replace',
      path: [],
      node: 'first',
      previous: null,
    });
  });

  it('reports expand with the path and percentage', () => {
    const onChange = vi.fn();
    render(
      <Mosaic<string>
        initialValue={NESTED_TREE}
        onChange={onChange}
        renderTile={renderWindow}
      />,
    );

    fireEvent.click(screen.getAllByTitle('Expand')[2]);

    expect(lastMeta(onChange)).toEqual({
      type: 'expand',
      path: [1, 1],
      percentage: 70,
    });
  });

  it('reports resize on every move and on release', () => {
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
    const onChange = vi.fn();
    const onRelease = vi.fn();
    const { container } = render(
      <Mosaic<string>
        initialValue={NESTED_TREE}
        onChange={onChange}
        onRelease={onRelease}
        renderTile={renderWindow}
      />,
    );

    const splitter = container.querySelectorAll('.mosaic-split')[0];
    fireEvent.mouseDown(splitter, { button: 0 });
    fireEvent.mouseMove(document, { clientX: 400, clientY: 100 });
    expect(lastMeta(onChange)).toEqual({
      type: 'resize',
      path: [],
      splitPercentages: [40, 60],
    });

    fireEvent.mouseUp(document, { clientX: 400, clientY: 100 });
    expect(lastMeta(onRelease)).toMatchObject({ type: 'resize', path: [] });
  });

  it('reports split with the newly created node', async () => {
    const onChange = vi.fn();
    render(
      <Mosaic<string>
        initialValue={NESTED_TREE}
        onChange={onChange}
        createNode={() => 'new'}
        renderTile={(id, path) => (
          <MosaicWindow<string> path={path} title={id} createNode={() => 'new'}>
            {id}
          </MosaicWindow>
        )}
      />,
    );

    fireEvent.click(screen.getAllByTitle('Split Window')[0]);

    await waitFor(() =>
      expect(lastMeta(onChange)).toEqual({
        type: 'split',
        path: [0],
        node: 'new',
      }),
    );
  });

  it('reports tab select, tab add and tab remove', async () => {
    const onChange = vi.fn();
    const { container } = render(
      <Mosaic<string>
        initialValue={TABS_TREE}
        onChange={onChange}
        createNode={() => 'd'}
        renderTile={renderWindow}
      />,
    );

    fireEvent.click(container.querySelectorAll('.mosaic-tab-button')[2]);
    expect(lastMeta(onChange)).toEqual({
      type: 'tab-select',
      path: [],
      index: 2,
    });

    await act(() => actions!.addTab([]));
    expect(lastMeta(onChange)).toEqual({ type: 'tab-add', path: [], tab: 'd' });

    act(() => actions!.removeTab([], 1));
    expect(lastMeta(onChange)).toEqual({
      type: 'tab-remove',
      path: [],
      index: 1,
      tab: 'b',
    });
  });

  it('reports tab add when a leaf becomes a tab group', async () => {
    const onChange = vi.fn();
    render(
      <Mosaic<string>
        initialValue="solo"
        onChange={onChange}
        createNode={() => 'next'}
        renderTile={renderWindow}
      />,
    );

    await act(() => actions!.addTab([]));

    expect(lastMeta(onChange)).toEqual({
      type: 'tab-add',
      path: [],
      tab: 'next',
    });
  });

  it('reports drag start and cancel without onRelease', () => {
    const onChange = vi.fn();
    const onRelease = vi.fn();
    render(
      <Mosaic<string>
        initialValue={NESTED_TREE}
        onChange={onChange}
        onRelease={onRelease}
        renderTile={renderWindow}
      />,
    );

    act(() => actions!.hide([1, 0]));
    expect(lastMeta(onChange)).toEqual({ type: 'drag-start', path: [1, 0] });

    act(() => actions!.show([1, 0]));
    expect(lastMeta(onChange)).toEqual({ type: 'drag-cancel', path: [1, 0] });

    expect(onRelease).not.toHaveBeenCalled();
  });

  it('reports update for updateTree without meta and passes a given meta through', () => {
    const onChange = vi.fn();
    render(
      <Mosaic<string>
        initialValue={NESTED_TREE}
        onChange={onChange}
        renderTile={renderWindow}
      />,
    );

    act(() =>
      actions!.updateTree([
        { path: [], spec: { direction: { $set: 'column' } } },
      ]),
    );
    expect(lastMeta(onChange)).toEqual({ type: 'update' });

    const custom: MosaicChangeMeta<string> = {
      type: 'replace',
      path: [0],
      node: 'z',
      previous: 'a',
    };
    act(() =>
      actions!.updateTree([{ path: [0], spec: { $set: 'z' } }], {
        meta: custom,
      }),
    );
    expect(lastMeta(onChange)).toEqual(custom);
  });

  it('reports migrate when a controlled legacy value is converted', () => {
    const onChange = vi.fn();
    const legacy: LegacyMosaicNode<string> = {
      direction: 'row',
      first: 'a',
      second: 'b',
    };
    render(
      <Mosaic<string>
        value={legacy}
        onChange={onChange}
        renderTile={renderWindow}
      />,
    );

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(lastMeta(onChange)).toEqual({ type: 'migrate' });
  });

  it('still works with single-argument handlers', () => {
    const trees: (MosaicNode<string> | null)[] = [];
    const handler = (node: MosaicNode<string> | null) => {
      trees.push(node);
    };
    render(
      <Mosaic<string>
        initialValue={NESTED_TREE}
        onChange={handler}
        onRelease={handler}
        renderTile={renderWindow}
      />,
    );

    fireEvent.click(screen.getAllByTitle('Close Window')[0]);

    expect(trees).toHaveLength(2);
    expect(trees[0]).toEqual(trees[1]);
  });
});
