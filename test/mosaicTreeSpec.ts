import { expect } from 'chai';

import { MosaicTree } from '../src/util/mosaicTree';
import { MosaicSchema } from '../src/configuration/types';

const SINGLE: MosaicSchema = 'a';
const TWO_PANEL: MosaicSchema = { direction: 'row', first: 'a', second: 'b' };
const DEEP: MosaicSchema = {
  direction: 'row',
  first: 'a',
  second: { direction: 'column', first: 'b', second: 'c' },
};

describe('MosaicTree', () => {
  describe('isSingleLeaf', () => {
    it('should return true for a string leaf', () => {
      expect(MosaicTree.isSingleLeaf('a')).to.equal(true);
    });

    it('should return false for a split node', () => {
      expect(MosaicTree.isSingleLeaf(TWO_PANEL)).to.equal(false);
    });

    it('should return false for null', () => {
      expect(MosaicTree.isSingleLeaf(null)).to.equal(false);
    });
  });

  describe('count', () => {
    it('should return 0 for null', () => {
      expect(MosaicTree.count(null)).to.equal(0);
    });

    it('should return 1 for a single leaf', () => {
      expect(MosaicTree.count(SINGLE)).to.equal(1);
    });

    it('should return 2 for two panels', () => {
      expect(MosaicTree.count(TWO_PANEL)).to.equal(2);
    });

    it('should return 3 for deep tree', () => {
      expect(MosaicTree.count(DEEP)).to.equal(3);
    });
  });

  describe('getComponentKeys', () => {
    it('should return [] for null', () => {
      expect(MosaicTree.getComponentKeys(null)).to.deep.equal([]);
    });

    it('should return single key for a leaf', () => {
      expect(MosaicTree.getComponentKeys('x')).to.deep.equal(['x']);
    });

    it('should return all keys for deep tree', () => {
      expect(MosaicTree.getComponentKeys(DEEP)).to.deep.equal(['a', 'b', 'c']);
    });
  });

  describe('contains', () => {
    it('should return false for null tree', () => {
      expect(MosaicTree.contains(null, 'a')).to.equal(false);
    });

    it('should return true when leaf matches', () => {
      expect(MosaicTree.contains('a', 'a')).to.equal(true);
    });

    it('should return false when leaf does not match', () => {
      expect(MosaicTree.contains('a', 'b')).to.equal(false);
    });

    it('should find a key in deep tree', () => {
      expect(MosaicTree.contains(DEEP, 'c')).to.equal(true);
    });

    it('should return false for missing key in deep tree', () => {
      expect(MosaicTree.contains(DEEP, 'z')).to.equal(false);
    });
  });

  describe('add', () => {
    it('should return the key itself for an empty tree', () => {
      expect(MosaicTree.add(null, 'x')).to.equal('x');
    });

    it('should wrap existing leaf in a row split', () => {
      const result = MosaicTree.add('a', 'b');
      expect(result).to.deep.equal({ direction: 'row', first: 'a', second: 'b', splitPercentage: 50 });
    });

    it('should append to the right of a complex tree', () => {
      const result = MosaicTree.add(TWO_PANEL, 'c');
      expect(typeof result).to.equal('object');
      expect(MosaicTree.getComponentKeys(result)).to.include('c');
      expect(MosaicTree.count(result)).to.equal(3);
    });
  });

  describe('remove', () => {
    it('should return null for null tree', () => {
      expect(MosaicTree.remove(null, 'a')).to.equal(null);
    });

    it('should return null when removing the only leaf', () => {
      expect(MosaicTree.remove('a', 'a')).to.equal(null);
    });

    it('should return unchanged leaf when key does not match', () => {
      expect(MosaicTree.remove('a', 'b')).to.equal('a');
    });

    it('should collapse to remaining sibling when removing from two-panel', () => {
      expect(MosaicTree.remove(TWO_PANEL, 'a')).to.equal('b');
      expect(MosaicTree.remove(TWO_PANEL, 'b')).to.equal('a');
    });

    it('should remove a deep leaf and collapse its branch', () => {
      const result = MosaicTree.remove(DEEP, 'b');
      expect(MosaicTree.contains(result, 'b')).to.equal(false);
      expect(MosaicTree.contains(result, 'a')).to.equal(true);
      expect(MosaicTree.contains(result, 'c')).to.equal(true);
      expect(MosaicTree.count(result)).to.equal(2);
    });

    it('should be a no-op when the key is absent', () => {
      expect(MosaicTree.remove(DEEP, 'z')).to.deep.equal(DEEP);
    });
  });

  describe('createDefault', () => {
    it('should return a single leaf at depth 0 with one value', () => {
      expect(MosaicTree.createDefault(0, ['a'])).to.equal('a');
    });

    it('should build a split node at depth 1 with multiple values', () => {
      const result = MosaicTree.createDefault(1, ['a', 'b']);
      expect(typeof result).to.equal('object');
    });

    it('should build a nested tree at depth 2', () => {
      const result = MosaicTree.createDefault(2, ['a', 'b', 'c']);
      expect(typeof result).to.equal('object');
    });
  });
});
