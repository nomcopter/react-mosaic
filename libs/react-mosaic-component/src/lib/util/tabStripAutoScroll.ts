import { RefObject, useEffect } from 'react';
import { useDragLayer } from 'react-dnd';

import { MosaicDragType } from '../types';
import { getTouchGesture } from './touchGesture';

// How close to a strip edge the finger has to be to scroll it, in px
export const AUTO_SCROLL_EDGE_PX = 32;
// Fastest scroll speed, in px per frame, reached at the very edge
export const AUTO_SCROLL_MAX_STEP_PX = 12;

interface StripRect {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

/**
 * How far to scroll a tab strip this frame for a pointer at (x, y): negative
 * near the left edge, positive near the right edge, faster closer to the edge,
 * and 0 when the pointer isn't over the strip.
 */
export function getAutoScrollStep(
  rect: StripRect,
  x: number,
  y: number,
): number {
  if (y < rect.top || y > rect.bottom || x < rect.left || x > rect.right) {
    return 0;
  }
  const fromLeft = x - rect.left;
  const fromRight = rect.right - x;
  const speed = (distance: number) =>
    Math.ceil(
      ((AUTO_SCROLL_EDGE_PX - distance) / AUTO_SCROLL_EDGE_PX) *
        AUTO_SCROLL_MAX_STEP_PX,
    );
  if (fromLeft < AUTO_SCROLL_EDGE_PX && fromLeft <= fromRight) {
    return -speed(fromLeft);
  }
  if (fromRight < AUTO_SCROLL_EDGE_PX) {
    return speed(fromRight);
  }
  return 0;
}

/**
 * While a window or tab is dragged by touch, scrolls the tab strip when the
 * finger rests near one of its edges, so tabs and drop spots that are scrolled
 * out of view can be reached. Mouse drags are left alone.
 */
export function useTabStripAutoScroll(
  stripRef: RefObject<HTMLElement | null>,
): void {
  const isDragging = useDragLayer(
    (monitor) =>
      monitor.isDragging() && monitor.getItemType() === MosaicDragType.WINDOW,
  );

  useEffect(() => {
    const strip = stripRef.current;
    const view = strip?.ownerDocument.defaultView;
    if (!isDragging || strip == null || view == null) {
      return;
    }
    const doc = strip.ownerDocument;
    // The drag started on a touchmove that came before this listener, so
    // start from where the gesture tracker last saw the finger
    const gesture = getTouchGesture(doc);
    let finger: { x: number; y: number } | null = gesture
      ? { x: gesture.lastX, y: gesture.lastY }
      : null;
    let frame = 0;

    const onTouchMove = (event: TouchEvent) => {
      const touch = event.touches[0];
      finger = touch ? { x: touch.clientX, y: touch.clientY } : null;
    };
    const tick = () => {
      if (finger) {
        const step = getAutoScrollStep(
          strip.getBoundingClientRect(),
          finger.x,
          finger.y,
        );
        if (step !== 0) {
          strip.scrollLeft += step;
        }
      }
      frame = view.requestAnimationFrame(tick);
    };

    // The strip scrolls smoothly by default, which would animate (and lag)
    // every per-frame step
    const scrollBehavior = strip.style.scrollBehavior;
    strip.style.scrollBehavior = 'auto';
    doc.addEventListener('touchmove', onTouchMove, { passive: true });
    frame = view.requestAnimationFrame(tick);
    return () => {
      doc.removeEventListener('touchmove', onTouchMove);
      view.cancelAnimationFrame(frame);
      strip.style.scrollBehavior = scrollBehavior;
    };
  }, [isDragging, stripRef]);
}
