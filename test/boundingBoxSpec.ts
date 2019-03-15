import { expect } from 'chai';
import { BoundingBox } from '../src/util/BoundingBox';

// Yay javascript float precision
function expectBoundingBoxCloseTo(a: BoundingBox, b: BoundingBox, delta: number = 0.000001) {
  expect(a.top).to.be.closeTo(b.top, delta);
  expect(a.right).to.be.closeTo(b.right, delta);
  expect(a.bottom).to.be.closeTo(b.bottom, delta);
  expect(a.left).to.be.closeTo(b.left, delta);
}

describe('BoundingBox', () => {
  describe('Root', () => {
    const EMPTY = BoundingBox.empty();
    it('should split column', () => {
      const { first, second } = BoundingBox.split(EMPTY, 25, 'column');
      expectBoundingBoxCloseTo(first, {
        top: 0,
        right: 0,
        bottom: 75,
        left: 0,
      });
      expectBoundingBoxCloseTo(second, {
        top: 25,
        right: 0,
        bottom: 0,
        left: 0,
      });
    });
    it('should split row', () => {
      const { first, second } = BoundingBox.split(EMPTY, 25, 'row');
      expectBoundingBoxCloseTo(first, {
        top: 0,
        right: 75,
        bottom: 0,
        left: 0,
      });
      expectBoundingBoxCloseTo(second, {
        top: 0,
        right: 0,
        bottom: 0,
        left: 25,
      });
    });
  });
  describe('Complex', () => {
    const COMPLEX = {
      top: 100 / 6,
      right: 100 / 6,
      bottom: 100 / 6,
      left: 100 / 6,
    };
    it('should split column', () => {
      const { first, second } = BoundingBox.split(COMPLEX, 25, 'column');
      expectBoundingBoxCloseTo(first, {
        top: 100 / 6,
        right: 100 / 6,
        bottom: (100 / 6) * 4,
        left: 100 / 6,
      });
      expectBoundingBoxCloseTo(second, {
        top: (100 / 6) * 2,
        right: 100 / 6,
        bottom: 100 / 6,
        left: 100 / 6,
      });
    });
  });
});
