import { describe, expect, it } from 'vitest';

import { Split, SplitProps } from './Split';

describe('Split resize resilience', () => {
  function makeSplit(splitPercentages: number[]): Split {
    const props: SplitProps = {
      direction: 'row',
      boundingBox: { top: 0, right: 0, bottom: 0, left: 0 },
      splitPercentages,
      splitIndex: 0,
      minimumPaneSizePercentage: 10,
      onChange: () => void 0,
      onRelease: () => void 0,
    };
    return new Split(props);
  }

  // Regression: resizing could throw a TypeError when the split was unmounted
  // or detached from the DOM mid-drag, because parentElement was null.

  it('returns the current percentages instead of throwing when rootElement is gone', () => {
    const percentages = [50, 50];
    const split = makeSplit(percentages);
    // rootElement.current is null (never mounted / unmounted mid-drag)
    const event = { clientX: 100, clientY: 100 } as unknown as MouseEvent;

    expect(() => (split as any).calculateNewPercentages(event)).not.toThrow();
    expect((split as any).calculateNewPercentages(event)).toBe(percentages);
  });

  it('returns the current percentages when the element is detached (no parentElement)', () => {
    const percentages = [30, 70];
    const split = makeSplit(percentages);
    // A detached element has a null parentElement
    (split as any).rootElement = { current: document.createElement('div') };
    const event = { clientX: 0, clientY: 0 } as unknown as MouseEvent;

    expect(() => (split as any).calculateNewPercentages(event)).not.toThrow();
    expect((split as any).calculateNewPercentages(event)).toBe(percentages);
  });
});
