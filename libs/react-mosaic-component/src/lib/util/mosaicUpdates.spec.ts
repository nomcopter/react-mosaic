import { describe, expect, it } from 'vitest';

import { MosaicNode, MosaicPath, MosaicSplitNode } from '../types';
import {
  updateTree,
  createRemoveUpdate,
  createDragToUpdates,
  createExpandUpdate,
} from './mosaicUpdates';
import { getLeaves, getNodeAtPath } from './mosaicUtilities';
import { MosaicDropTargetPosition } from '../internalTypes';
// Import the new n-ary types

// The test tree converted to the new n-ary format
const NARY_MEDIUM_TREE: MosaicNode<number> = {
  type: 'split',
  direction: 'row',
  children: [
    1,
    {
      type: 'split',
      direction: 'column',
      children: [
        {
          type: 'split',
          direction: 'column',
          children: [2, 3],
        },
        4,
      ],
    },
  ],
};

describe('mosaicUpdates', () => {
  describe('updateTree', () => {
    // Paths are now numeric arrays
    const simpleUpdatedTree = updateTree(NARY_MEDIUM_TREE, [
      {
        path: [0], // was ['first']
        spec: {
          $set: 5,
        },
      },
    ]);

    it('should apply update', () => {
      expect(getNodeAtPath(simpleUpdatedTree, [0])).to.equal(5);
    });

    it('roots should not be reference equal', () => {
      expect(simpleUpdatedTree).to.not.equal(NARY_MEDIUM_TREE);
    });

    it('unchanged nodes should be reference equal', () => {
      const path: MosaicPath = [1]; // was ['second']
      expect(getNodeAtPath(simpleUpdatedTree, path)).to.equal(
        getNodeAtPath(NARY_MEDIUM_TREE, path),
      );
    });
  });

  describe('createExpandUpdate', () => {
    it('expands a child of a split without splitPercentages', () => {
      const tree: MosaicNode<string> = {
        type: 'split',
        direction: 'row',
        children: ['a', 'b'],
      };

      expect(updateTree(tree, [createExpandUpdate([0], 70)])).toEqual({
        type: 'split',
        direction: 'row',
        children: ['a', 'b'],
        splitPercentages: [70, 30],
      });
    });

    it('expands every split along a deeply nested path', () => {
      const expanded = updateTree(NARY_MEDIUM_TREE, [
        createExpandUpdate([1, 0, 1], 80),
      ]) as MosaicSplitNode<number>;

      expect(expanded.splitPercentages).toEqual([20, 80]);
      const middle = getNodeAtPath(expanded, [1]) as MosaicSplitNode<number>;
      expect(middle.splitPercentages).toEqual([80, 20]);
      const inner = getNodeAtPath(expanded, [1, 0]) as MosaicSplitNode<number>;
      expect(inner.splitPercentages).toEqual([20, 80]);
      expect(getLeaves(expanded)).toEqual(getLeaves(NARY_MEDIUM_TREE));
    });

    it('overrides existing splitPercentages', () => {
      const tree: MosaicNode<string> = {
        type: 'split',
        direction: 'column',
        children: ['a', 'b', 'c'],
        splitPercentages: [50, 25, 25],
      };

      const expanded = updateTree(tree, [
        createExpandUpdate([2], 60),
      ]) as MosaicSplitNode<string>;

      expect(expanded.splitPercentages).toEqual([20, 20, 60]);
    });

    it('stops at a tabs node and expands the tab group in its parent', () => {
      const tree: MosaicNode<string> = {
        type: 'split',
        direction: 'row',
        children: ['a', { type: 'tabs', tabs: ['b', 'c'], activeTabIndex: 0 }],
      };

      expect(updateTree(tree, [createExpandUpdate([1, 1], 70)])).toEqual({
        ...tree,
        splitPercentages: [30, 70],
      });
    });

    it('leaves a single leaf root unchanged', () => {
      expect(updateTree<string>('a', [createExpandUpdate([], 70)])).toBe('a');
    });
  });

  describe('createRemoveUpdate', () => {
    it('should fail on a path that leads to a leaf partway through', () => {
      // Path [0, 0] is invalid because node at [0] is leaf '1'
      expect(() => createRemoveUpdate(NARY_MEDIUM_TREE, [0, 0])).to.throw(
        Error,
      );
    });

    it('should remove a leaf and collapse its parent', () => {
      // Path to node '4' is [1, 1]
      const updatedTree = updateTree(NARY_MEDIUM_TREE, [
        createRemoveUpdate(NARY_MEDIUM_TREE, [1, 1]),
      ]);
      // The parent at path [1] should now be replaced by its single remaining child (which was at [1, 0])
      expect(getNodeAtPath(updatedTree, [1])).to.deep.equal(
        getNodeAtPath(NARY_MEDIUM_TREE, [1, 0]),
      );
    });

    it('should fail to remove root', () => {
      expect(() =>
        updateTree(NARY_MEDIUM_TREE, [
          createRemoveUpdate(NARY_MEDIUM_TREE, []),
        ]),
      ).to.throw(Error);
    });

    it('should fail to remove non-existant node', () => {
      expect(() =>
        updateTree(NARY_MEDIUM_TREE, [
          createRemoveUpdate(NARY_MEDIUM_TREE, [0, 0]),
        ]),
      ).to.throw(Error);
    });
  });

  describe('createDragToUpdates', () => {
    describe('drag leaf to unrelated leaf to create a SPLIT', () => {
      const updatedTree = updateTree(
        NARY_MEDIUM_TREE,
        createDragToUpdates(
          NARY_MEDIUM_TREE,
          [1, 0, 1], // Path to '3'
          [1, 1], // Path to '4'
          { type: 'split', position: MosaicDropTargetPosition.RIGHT },
        ),
      );

      it('should make source parent a leaf', () => {
        // Parent of '3' (at [1, 0]) now becomes just '2'
        expect(getNodeAtPath(updatedTree, [1, 0])).to.equal(2);
      });

      it('should place source in a new split at the destination', () => {
        // The new path for '3' is inside the new split, at the 2nd position
        expect(getNodeAtPath(updatedTree, [1, 1, 1])).to.equal(3);
      });

      it('destination should be a sibling in the new split', () => {
        // Original '4' is now at the 1st position
        expect(getNodeAtPath(updatedTree, [1, 1, 0])).to.equal(4);
      });

      it('direction of the new split should be correct', () => {
        // The new parent at [1, 1] is a split node
        const newParent = getNodeAtPath(
          updatedTree,
          [1, 1],
        ) as MosaicSplitNode<number>;
        expect(newParent.type).to.equal('split');
        expect(newParent.direction).to.equal('row');
      });
    });

    describe('drag leaf to root', () => {
      const updatedTree = updateTree(
        NARY_MEDIUM_TREE,
        createDragToUpdates(
          NARY_MEDIUM_TREE,
          [1, 1], // Path to '4'
          [], // Path to root
          {
            type: 'split',
            position: MosaicDropTargetPosition.RIGHT,
          },
        ),
      );

      it('should make the new root a split node', () => {
        const root = updatedTree as MosaicSplitNode<number>;
        expect(root.type).to.equal('split');
        expect(root.direction).to.equal('row');
      });

      it('should place the dragged node at the top level', () => {
        // The dragged node '4' is added as a new child to the existing root split
        // Since we're dropping to the RIGHT, it should be the last child
        expect(getNodeAtPath(updatedTree, [2])).to.equal(4);
      });

      it('should place the original tree (pruned) as siblings', () => {
        // The original tree structure is preserved, with node '4' removed
        // Node 1 should still be at [0]
        expect(getNodeAtPath(updatedTree, [0])).to.equal(1);
        // The collapsed split (originally at [1]) should now contain nodes 2 and 3
        const collapsedSplit = getNodeAtPath(updatedTree, [1]);
        expect(collapsedSplit).to.deep.equal({
          type: 'split',
          direction: 'column',
          children: [2, 3],
        });
      });
    });
  });
});
