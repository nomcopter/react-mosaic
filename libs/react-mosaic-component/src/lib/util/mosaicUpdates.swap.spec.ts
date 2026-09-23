import { describe, expect, it } from 'vitest';

import { MosaicNode } from '../types';
import {
  createDragToUpdates,
  createSwapUpdates,
  updateTree,
} from './mosaicUpdates';

const NESTED: MosaicNode<string> = {
  type: 'split',
  direction: 'row',
  splitPercentages: [30, 70],
  children: [
    'a',
    {
      type: 'split',
      direction: 'column',
      splitPercentages: [25, 75],
      children: [
        'b',
        {
          type: 'split',
          direction: 'row',
          children: ['c', 'd'],
        },
      ],
    },
  ],
};

const swap = (
  tree: MosaicNode<string>,
  pathA: number[],
  pathB: number[],
): MosaicNode<string> =>
  updateTree(tree, createSwapUpdates(tree, pathA, pathB));

describe('createSwapUpdates', () => {
  it('swaps siblings and keeps sizes with positions', () => {
    expect(swap(NESTED, [1, 0], [1, 1])).toEqual({
      ...NESTED,
      children: [
        'a',
        {
          type: 'split',
          direction: 'column',
          splitPercentages: [25, 75],
          children: [
            { type: 'split', direction: 'row', children: ['c', 'd'] },
            'b',
          ],
        },
      ],
    });
  });

  it('swaps leaves at different depths', () => {
    const result = swap(NESTED, [0], [1, 1, 1]);
    expect(result).toEqual({
      ...NESTED,
      children: [
        'd',
        {
          type: 'split',
          direction: 'column',
          splitPercentages: [25, 75],
          children: [
            'b',
            { type: 'split', direction: 'row', children: ['c', 'a'] },
          ],
        },
      ],
    });
  });

  it('swaps root-level children of a split without splitPercentages', () => {
    const tree: MosaicNode<string> = {
      type: 'split',
      direction: 'row',
      children: ['a', 'b', 'c'],
    };
    expect(swap(tree, [0], [2])).toEqual({
      type: 'split',
      direction: 'row',
      children: ['c', 'b', 'a'],
    });
  });

  it('swaps a tab with a leaf outside the tab group', () => {
    const tree: MosaicNode<string> = {
      type: 'split',
      direction: 'row',
      children: ['a', { type: 'tabs', tabs: ['b', 'c'], activeTabIndex: 1 }],
    };
    expect(swap(tree, [1, 1], [0])).toEqual({
      type: 'split',
      direction: 'row',
      children: ['c', { type: 'tabs', tabs: ['b', 'a'], activeTabIndex: 1 }],
    });
  });

  it('is a no-op when swapping a node with itself', () => {
    expect(createSwapUpdates(NESTED, [1, 0], [1, 0])).toEqual([]);
  });

  it('refuses to swap a node with its ancestor', () => {
    expect(() => createSwapUpdates(NESTED, [1], [1, 1, 0])).toThrow(
      'ancestor or descendant',
    );
  });

  it('refuses to put a split into a tab group', () => {
    const tree: MosaicNode<string> = {
      type: 'split',
      direction: 'row',
      children: [
        { type: 'split', direction: 'column', children: ['a', 'b'] },
        { type: 'tabs', tabs: ['c', 'd'], activeTabIndex: 0 },
      ],
    };
    expect(() => createSwapUpdates(tree, [0], [1, 0])).toThrow('tab group');
  });

  it('throws for a path that does not exist', () => {
    expect(() => createSwapUpdates(NESTED, [0], [5])).toThrow();
  });

  it('is what createDragToUpdates does for a swap drop', () => {
    expect(
      updateTree(
        NESTED,
        createDragToUpdates(NESTED, [0], [1, 0], { type: 'swap' }),
      ),
    ).toEqual(swap(NESTED, [0], [1, 0]));
  });
});
