import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render } from '@testing-library/react';

import { RESIZING_CLASS, Split, SplitProps } from './Split';

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

// Regression for #233: iframes inside tiles swallowed mousemove/mouseup, so a
// resize stopped as soon as the cursor crossed one. While dragging, Split puts
// a class on <html> that turns off pointer events on tiles.
describe('Split resizing class', () => {
  const html = document.documentElement;

  function renderSplit(overrides: Partial<SplitProps> = {}) {
    const onChange = vi.fn();
    const onRelease = vi.fn();
    const result = render(
      React.createElement(
        'div',
        null,
        React.createElement(Split, {
          direction: 'row',
          boundingBox: { top: 0, right: 0, bottom: 0, left: 0 },
          splitPercentages: [50, 50],
          splitIndex: 0,
          onChange,
          onRelease,
          ...overrides,
        }),
      ),
    );
    const splitElement = result.container.querySelector(
      '.mosaic-split',
    ) as HTMLElement;
    return { ...result, splitElement, onChange, onRelease };
  }

  afterEach(() => {
    cleanup();
    html.classList.remove(
      RESIZING_CLASS,
      `${RESIZING_CLASS}-row`,
      `${RESIZING_CLASS}-column`,
    );
  });

  it('adds the class with the split direction while dragging and removes it on release', () => {
    const { splitElement, onRelease } = renderSplit({ direction: 'column' });

    fireEvent.mouseDown(splitElement, { button: 0 });
    expect(html.classList.contains(RESIZING_CLASS)).toBe(true);
    expect(html.classList.contains(`${RESIZING_CLASS}-column`)).toBe(true);

    fireEvent.mouseUp(document);
    expect(html.classList.contains(RESIZING_CLASS)).toBe(false);
    expect(html.classList.contains(`${RESIZING_CLASS}-column`)).toBe(false);
    expect(onRelease).toHaveBeenCalledTimes(1);
  });

  it('removes the class when the mouse is released over another element', () => {
    const { splitElement } = renderSplit();
    const elsewhere = document.body.appendChild(document.createElement('div'));

    fireEvent.mouseDown(splitElement, { button: 0 });
    fireEvent.mouseUp(elsewhere);

    expect(html.classList.contains(RESIZING_CLASS)).toBe(false);
    elsewhere.remove();
  });

  it('ignores non-primary buttons', () => {
    const { splitElement } = renderSplit();

    fireEvent.mouseDown(splitElement, { button: 2 });

    expect(html.classList.contains(RESIZING_CLASS)).toBe(false);
  });

  it('removes the class on touchend and touchcancel', () => {
    const { splitElement } = renderSplit();
    const touch = { clientX: 0, clientY: 0 };

    fireEvent.touchStart(splitElement, { changedTouches: [touch] });
    expect(html.classList.contains(RESIZING_CLASS)).toBe(true);
    fireEvent.touchEnd(document, { changedTouches: [touch] });
    expect(html.classList.contains(RESIZING_CLASS)).toBe(false);

    fireEvent.touchStart(splitElement, { changedTouches: [touch] });
    fireEvent.touchCancel(document, { changedTouches: [touch] });
    expect(html.classList.contains(RESIZING_CLASS)).toBe(false);
  });

  it('cleans up the class and document listeners when unmounted mid-drag', () => {
    const { splitElement, unmount, onChange, onRelease } = renderSplit();

    fireEvent.mouseDown(splitElement, { button: 0 });
    unmount();

    expect(html.classList.contains(RESIZING_CLASS)).toBe(false);
    fireEvent.mouseMove(document, { clientX: 10 });
    fireEvent.mouseUp(document);
    expect(onChange).not.toHaveBeenCalled();
    expect(onRelease).not.toHaveBeenCalled();
  });
});
