import { afterEach, describe, expect, it } from 'vitest';
import { fireEvent } from '@testing-library/react';

import {
  getTouchGesture,
  shouldTouchDragTab,
  TAB_LONG_PRESS_MS,
  TouchGesture,
  trackTouchGestures,
} from './touchGesture';

function gesture(dx: number, dy: number, startTime = 1000): TouchGesture {
  return { startX: 10, startY: 10, startTime, lastX: 10 + dx, lastY: 10 + dy };
}

function touches(x: number, y: number) {
  const touch = { clientX: x, clientY: y, identifier: 0 };
  return { touches: [touch], targetTouches: [touch], changedTouches: [touch] };
}

describe('shouldTouchDragTab', () => {
  it('drags when there is no touch gesture (mouse)', () => {
    expect(shouldTouchDragTab(null, 5000)).toBe(true);
  });

  it('scrolls on a quick sideways swipe', () => {
    expect(shouldTouchDragTab(gesture(30, 4), 1050)).toBe(false);
    expect(shouldTouchDragTab(gesture(-30, 4), 1050)).toBe(false);
  });

  it('scrolls on a diagonal swipe that is only a bit more vertical', () => {
    expect(shouldTouchDragTab(gesture(20, 24), 1050)).toBe(false);
    expect(shouldTouchDragTab(gesture(0, 0), 1050)).toBe(false);
  });

  it('drags on a quick vertical move', () => {
    expect(shouldTouchDragTab(gesture(4, 30), 1050)).toBe(true);
    expect(shouldTouchDragTab(gesture(4, -30), 1050)).toBe(true);
  });

  it('drags in any direction after a long press', () => {
    expect(shouldTouchDragTab(gesture(30, 0), 1000 + TAB_LONG_PRESS_MS)).toBe(
      true,
    );
  });
});

describe('trackTouchGestures', () => {
  let stop: (() => void) | undefined;

  afterEach(() => {
    stop?.();
    stop = undefined;
  });

  it('follows a single-finger touch until it ends', () => {
    stop = trackTouchGestures(document);

    fireEvent.touchStart(document.body, touches(5, 6));
    expect(getTouchGesture(document)).toEqual(
      expect.objectContaining({ startX: 5, startY: 6, lastX: 5, lastY: 6 }),
    );

    fireEvent.touchMove(document.body, touches(25, 7));
    expect(getTouchGesture(document)).toEqual(
      expect.objectContaining({ startX: 5, lastX: 25, lastY: 7 }),
    );

    fireEvent.touchEnd(document.body, {
      touches: [],
      changedTouches: [{ clientX: 25, clientY: 7, identifier: 0 }],
    });
    expect(getTouchGesture(document)).toBeNull();
  });

  it('keeps listening until the last tracker stops', () => {
    const stopFirst = trackTouchGestures(document);
    stop = trackTouchGestures(document);
    stopFirst();

    fireEvent.touchStart(document.body, touches(1, 2));
    expect(getTouchGesture(document)).not.toBeNull();

    stop();
    stop = undefined;
    fireEvent.touchStart(document.body, touches(3, 4));
    expect(getTouchGesture(document)).toBeNull();
  });
});
