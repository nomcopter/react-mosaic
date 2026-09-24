import { describe, expect, it } from 'vitest';

import {
  AUTO_SCROLL_EDGE_PX,
  AUTO_SCROLL_MAX_STEP_PX,
  getAutoScrollStep,
} from './tabStripAutoScroll';

const STRIP = { left: 100, right: 300, top: 0, bottom: 30 };

describe('getAutoScrollStep', () => {
  it('does nothing away from the edges', () => {
    expect(getAutoScrollStep(STRIP, 200, 15)).toBe(0);
  });

  it('scrolls left near the left edge, faster closer to it', () => {
    const near = getAutoScrollStep(STRIP, 100 + AUTO_SCROLL_EDGE_PX - 4, 15);
    const atEdge = getAutoScrollStep(STRIP, 100, 15);
    expect(near).toBeLessThan(0);
    expect(atEdge).toBe(-AUTO_SCROLL_MAX_STEP_PX);
    expect(atEdge).toBeLessThan(near);
  });

  it('scrolls right near the right edge', () => {
    expect(getAutoScrollStep(STRIP, 299, 15)).toBeGreaterThan(0);
    expect(getAutoScrollStep(STRIP, 300, 15)).toBe(AUTO_SCROLL_MAX_STEP_PX);
  });

  it('does nothing when the finger is outside the strip', () => {
    expect(getAutoScrollStep(STRIP, 110, 60)).toBe(0);
    expect(getAutoScrollStep(STRIP, 90, 15)).toBe(0);
    expect(getAutoScrollStep(STRIP, 310, 15)).toBe(0);
  });

  it('picks the closer edge on a strip narrower than both edge zones', () => {
    const narrow = { left: 0, right: 40, top: 0, bottom: 30 };
    expect(getAutoScrollStep(narrow, 5, 15)).toBeLessThan(0);
    expect(getAutoScrollStep(narrow, 35, 15)).toBeGreaterThan(0);
  });
});
