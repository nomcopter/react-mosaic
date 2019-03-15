import { expect } from 'chai';
import { getNodeAtPath, MosaicNode } from '../src/index';
import { MosaicDropTargetPosition } from '../src/internalTypes';
import { MosaicParent, MosaicPath } from '../src/types';
import { createDragToUpdates, createRemoveUpdate, updateTree } from '../src/util/mosaicUpdates';

const MEDIUM_TREE: MosaicNode<number> = {
  direction: 'row',
  first: 1,
  second: {
    direction: 'column',
    first: {
      direction: 'column',
      first: 2,
      second: 3,
    },
    second: 4,
  },
};

describe('mosaicUpdates', () => {
  describe('updateTree', () => {
    const simpleUpdatedTree = updateTree(MEDIUM_TREE, [
      {
        path: ['first'],
        spec: {
          $set: 5,
        },
      },
    ]);
    it('should apply update', () => {
      expect(getNodeAtPath(simpleUpdatedTree, ['first'])).to.equal(5);
    });
    it('roots should not be reference equal', () => {
      expect(simpleUpdatedTree).to.not.equal(MEDIUM_TREE);
    });
    it('unchanged nodes should be reference equal', () => {
      const path: MosaicPath = ['second'];
      expect(getNodeAtPath(simpleUpdatedTree, path)).to.equal(getNodeAtPath(MEDIUM_TREE, path));
    });
  });
  describe('createRemoveUpdate', () => {
    it('should fail on null', () => {
      expect(() => createRemoveUpdate(MEDIUM_TREE, ['first', 'first'])).to.throw(Error);
    });
    it('should remove leaf', () => {
      const updatedTree = updateTree(MEDIUM_TREE, [createRemoveUpdate(MEDIUM_TREE, ['second', 'second'])]);
      expect(getNodeAtPath(updatedTree, ['second'])).to.equal(getNodeAtPath(MEDIUM_TREE, ['second', 'first']));
    });
    it('should fail to remove root', () => {
      expect(() => updateTree(MEDIUM_TREE, [createRemoveUpdate(MEDIUM_TREE, [])])).to.throw(Error);
    });
    it('should fail to remove non-existant node', () => {
      expect(() => updateTree(MEDIUM_TREE, [createRemoveUpdate(MEDIUM_TREE, ['first', 'first'])])).to.throw(Error);
    });
  });
  describe('createDragToUpdates', () => {
    describe('drag leaf to unrelated leaf', () => {
      const updatedTree = updateTree(
        MEDIUM_TREE,
        createDragToUpdates(
          MEDIUM_TREE,
          ['second', 'first', 'second'],
          ['second', 'second'],
          MosaicDropTargetPosition.RIGHT,
        ),
      );
      it('should remove sourceNode', () => {
        expect(getNodeAtPath(updatedTree, ['second', 'first', 'second'])).to.equal(null);
      });
      it('should make source parent a leaf', () => {
        expect(getNodeAtPath(updatedTree, ['second', 'first'])).to.equal(2);
      });
      it('source should be in destination', () => {
        expect(getNodeAtPath(updatedTree, ['second', 'second', 'second'])).to.equal(3);
      });
      it('destination should be a sibling', () => {
        expect(getNodeAtPath(updatedTree, ['second', 'second', 'first'])).to.equal(4);
      });
      it('direction should be correct', () => {
        expect((getNodeAtPath(updatedTree, ['second', 'second']) as MosaicParent<number>).direction).to.equal('row');
      });
    });
    describe('drag leaf to unrelated parent', () => {
      const updatedTree = updateTree(
        MEDIUM_TREE,
        createDragToUpdates(MEDIUM_TREE, ['first'], ['second', 'first'], MosaicDropTargetPosition.TOP),
      );
      it('should remove sourceNode', () => {
        expect(getNodeAtPath(updatedTree, ['first'])).to.not.equal(1);
      });
      it('source should be in destination', () => {
        expect(getNodeAtPath(updatedTree, ['first', 'first'])).to.equal(1);
      });
      it('destination should be a sibling', () => {
        expect(getNodeAtPath(updatedTree, ['first', 'second', 'first'])).to.equal(2);
      });
      it('direction should be correct', () => {
        expect((getNodeAtPath(updatedTree, ['first']) as MosaicParent<number>).direction).to.equal('column');
      });
    });
    describe('drag leaf to root', () => {
      const updatedTree = updateTree(
        MEDIUM_TREE,
        createDragToUpdates(MEDIUM_TREE, ['second', 'second'], [], MosaicDropTargetPosition.RIGHT),
      );
      it('should remove sourceNode', () => {
        expect(getNodeAtPath(updatedTree, ['first', 'second', 'second'])).to.equal(3);
      });
      it('source should be in destination', () => {
        expect(getNodeAtPath(updatedTree, ['second'])).to.equal(4);
      });
      it('destination should be a sibling', () => {
        expect(getNodeAtPath(updatedTree, ['first', 'first'])).to.equal(1);
      });
      it('direction should be correct', () => {
        expect((getNodeAtPath(updatedTree, []) as MosaicParent<number>).direction).to.equal('row');
      });
    });
  });
  // TODO: createHideUpdate
  // TODO: createExpandUpdate
});
