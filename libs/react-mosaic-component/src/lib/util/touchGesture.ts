/**
 * Tracks the current single-finger touch gesture on a document, so a drag
 * source can tell a swipe from a drag when the touch backend asks whether it
 * can be dragged (which it does once, on the first move).
 */
export interface TouchGesture {
  startX: number;
  startY: number;
  startTime: number;
  lastX: number;
  lastY: number;
}

// Holding a tab this long before moving it drags it in any direction
export const TAB_LONG_PRESS_MS = 300;

const gestures = new WeakMap<Document, TouchGesture | null>();
const listenerCounts = new WeakMap<Document, number>();

function onTouchStart(event: TouchEvent): void {
  const doc = (event.currentTarget as Document | null) ?? document;
  const touch = event.touches[0];
  if (event.touches.length !== 1 || touch == null) {
    gestures.set(doc, null);
    return;
  }
  gestures.set(doc, {
    startX: touch.clientX,
    startY: touch.clientY,
    startTime: Date.now(),
    lastX: touch.clientX,
    lastY: touch.clientY,
  });
}

function onTouchMove(event: TouchEvent): void {
  const doc = (event.currentTarget as Document | null) ?? document;
  const gesture = gestures.get(doc);
  const touch = event.touches[0];
  if (gesture && touch) {
    gesture.lastX = touch.clientX;
    gesture.lastY = touch.clientY;
  }
}

function onTouchEnd(event: TouchEvent): void {
  const doc = (event.currentTarget as Document | null) ?? document;
  if (event.touches.length === 0) {
    gestures.set(doc, null);
  }
}

// Capture phase so the position is current before the touch backend (which
// listens on window) decides whether to start a drag.
const OPTIONS = { capture: true, passive: true };

/** Starts tracking touches on `doc`. Returns a function that stops it. */
export function trackTouchGestures(doc: Document): () => void {
  const count = listenerCounts.get(doc) ?? 0;
  if (count === 0) {
    doc.addEventListener('touchstart', onTouchStart, OPTIONS);
    doc.addEventListener('touchmove', onTouchMove, OPTIONS);
    doc.addEventListener('touchend', onTouchEnd, OPTIONS);
    doc.addEventListener('touchcancel', onTouchEnd, OPTIONS);
  }
  listenerCounts.set(doc, count + 1);
  return () => {
    const remaining = (listenerCounts.get(doc) ?? 1) - 1;
    listenerCounts.set(doc, remaining);
    if (remaining === 0) {
      doc.removeEventListener('touchstart', onTouchStart, OPTIONS);
      doc.removeEventListener('touchmove', onTouchMove, OPTIONS);
      doc.removeEventListener('touchend', onTouchEnd, OPTIONS);
      doc.removeEventListener('touchcancel', onTouchEnd, OPTIONS);
      gestures.delete(doc);
    }
  };
}

export function getTouchGesture(doc: Document): TouchGesture | null {
  return gestures.get(doc) ?? null;
}

/**
 * Whether a touch gesture on a tab should drag it. A quick horizontal swipe
 * scrolls the tab strip instead; a vertical move, or a long press, drags.
 * Returns true when there's no touch gesture (mouse drags are unaffected).
 */
export function shouldTouchDragTab(
  gesture: TouchGesture | null,
  now: number,
): boolean {
  if (gesture == null) {
    return true;
  }
  if (now - gesture.startTime >= TAB_LONG_PRESS_MS) {
    return true;
  }
  const dx = Math.abs(gesture.lastX - gesture.startX);
  const dy = Math.abs(gesture.lastY - gesture.startY);
  return dy > dx;
}
