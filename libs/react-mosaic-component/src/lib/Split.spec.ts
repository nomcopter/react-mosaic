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

  // A lost mouseup (alt-tab, alert, context menu) used to leave the class on
  // <html>, so every tile stayed unclickable until the next click.
  it('ends the drag on window blur, releasing at the last reported position', () => {
    const { splitElement, onChange, onRelease } = renderSplit();

    fireEvent.mouseDown(splitElement, { button: 0 });
    fireEvent.mouseMove(document, { buttons: 1, clientX: 10 });
    expect(onChange).toHaveBeenCalledTimes(1);

    fireEvent.blur(window);

    expect(html.classList.contains(RESIZING_CLASS)).toBe(false);
    expect(onRelease).toHaveBeenCalledTimes(1);
    expect(onRelease).toHaveBeenLastCalledWith(onChange.mock.calls[0][0]);

    // Listeners are gone: later events don't reach the split
    fireEvent.mouseMove(document, { buttons: 1, clientX: 20 });
    fireEvent.mouseUp(document);
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onRelease).toHaveBeenCalledTimes(1);
  });

  it('ends the drag on window blur without onRelease when nothing moved', () => {
    const { splitElement, onChange, onRelease } = renderSplit();

    fireEvent.mouseDown(splitElement, { button: 0 });
    fireEvent.blur(window);

    expect(html.classList.contains(RESIZING_CLASS)).toBe(false);
    expect(onChange).not.toHaveBeenCalled();
    expect(onRelease).not.toHaveBeenCalled();
  });

  it('ends the drag when the mouse moves with no button pressed', () => {
    const { splitElement, onChange, onRelease } = renderSplit();

    fireEvent.mouseDown(splitElement, { button: 0 });
    fireEvent.mouseMove(document, { buttons: 1, clientX: 10 });
    fireEvent.mouseMove(document, { buttons: 0, clientX: 30 });

    expect(html.classList.contains(RESIZING_CLASS)).toBe(false);
    // The buttonless move itself is not applied
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onRelease).toHaveBeenCalledTimes(1);
    expect(onRelease).toHaveBeenLastCalledWith(onChange.mock.calls[0][0]);

    fireEvent.mouseUp(document);
    expect(onRelease).toHaveBeenCalledTimes(1);
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

// Drives a real drag against a mocked parent size and returns what the split
// reports on release.
function dragSplit(
  props: Partial<SplitProps>,
  to: { clientX?: number; clientY?: number },
  parentSize = { width: 1000, height: 500 },
): number[] {
  const onRelease = vi.fn();
  const { container } = render(
    React.createElement(
      'div',
      null,
      React.createElement(Split, {
        direction: 'row',
        boundingBox: { top: 0, right: 0, bottom: 0, left: 0 },
        splitPercentages: [50, 50],
        splitIndex: 0,
        onRelease,
        ...props,
      }),
    ),
  );
  const parent = container.firstElementChild as HTMLElement;
  vi.spyOn(parent, 'getBoundingClientRect').mockReturnValue({
    left: 0,
    top: 0,
    ...parentSize,
  } as DOMRect);
  const splitElement = container.querySelector('.mosaic-split') as HTMLElement;

  fireEvent.mouseDown(splitElement, { button: 0 });
  fireEvent.mouseUp(document, { clientX: 0, clientY: 0, ...to });
  cleanup();
  return onRelease.mock.calls[0][0];
}

describe('Split minimum pane size', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('clamps to 10% by default', () => {
    expect(dragSplit({}, { clientX: 20 })).toEqual([10, 90]);
    expect(dragSplit({}, { clientX: 990 })).toEqual([90, 10]);
  });

  it('uses a plain number for both directions', () => {
    expect(dragSplit({ minimumPaneSizePercentage: 0 }, { clientX: 0 })).toEqual(
      [0, 100],
    );
    expect(
      dragSplit(
        { direction: 'column', minimumPaneSizePercentage: 25 },
        { clientY: 10 },
      ),
    ).toEqual([25, 75]);
  });

  it('uses per-direction values and falls back to 10% for a missing one', () => {
    const minimumPaneSizePercentage = { row: 0, column: 30 };
    expect(dragSplit({ minimumPaneSizePercentage }, { clientX: 0 })).toEqual([
      0, 100,
    ]);
    expect(
      dragSplit(
        { direction: 'column', minimumPaneSizePercentage },
        { clientY: 0 },
      ),
    ).toEqual([30, 70]);
    expect(
      dragSplit(
        { direction: 'column', minimumPaneSizePercentage: { row: 0 } },
        { clientY: 0 },
      ),
    ).toEqual([10, 90]);
  });

  it('only affects the two panes next to the divider in a 3-way split', () => {
    expect(
      dragSplit(
        {
          splitPercentages: [20, 30, 50],
          splitIndex: 1,
          minimumPaneSizePercentage: 5,
        },
        { clientX: 1000 },
      ),
    ).toEqual([20, 75, 5]);
  });

  it('caps the minimum at half of the two panes so neither goes negative', () => {
    // Two 8% panes can't both be 10% wide: the divider stays in the middle
    expect(
      dragSplit(
        { splitPercentages: [8, 8, 84], splitIndex: 0 },
        { clientX: 0 },
      ),
    ).toEqual([8, 8, 84]);
  });

  it('applies a pixel minimum when it is larger than the percentage', () => {
    // 1000px wide: 300px is 30%, larger than the default 10%
    expect(dragSplit({ minimumPaneSizePx: 300 }, { clientX: 0 })).toEqual([
      30, 70,
    ]);
    expect(dragSplit({ minimumPaneSizePx: 300 }, { clientX: 1000 })).toEqual([
      70, 30,
    ]);
    // 50px is 5%, so the 10% default still wins
    expect(dragSplit({ minimumPaneSizePx: 50 }, { clientX: 0 })).toEqual([
      10, 90,
    ]);
  });

  it('measures the pixel minimum against the split, not the whole root', () => {
    // The split is the right half (500px), so 100px is 20% of it
    expect(
      dragSplit(
        {
          boundingBox: { top: 0, right: 0, bottom: 0, left: 50 },
          minimumPaneSizePercentage: 0,
          minimumPaneSizePx: 100,
        },
        { clientX: 500 },
      ),
    ).toEqual([20, 80]);
  });

  it('uses per-direction pixel minimums', () => {
    const minimumPaneSizePx = { column: 100 };
    // 500px tall: 100px is 20%
    expect(
      dragSplit(
        {
          direction: 'column',
          minimumPaneSizePercentage: 0,
          minimumPaneSizePx,
        },
        { clientY: 0 },
      ),
    ).toEqual([20, 80]);
    expect(
      dragSplit(
        { minimumPaneSizePercentage: 0, minimumPaneSizePx },
        { clientX: 0 },
      ),
    ).toEqual([0, 100]);
  });

  it('keeps the current percentages when the root has no size', () => {
    expect(
      dragSplit(
        { minimumPaneSizePercentage: 0, minimumPaneSizePx: 100 },
        { clientX: 0 },
        { width: 0, height: 0 },
      ),
    ).toEqual([50, 50]);
  });

  it('works inside a nested bounding box', () => {
    // The split covers the right half of the root, so the pointer at 60% of
    // the root is 20% into this split.
    expect(
      dragSplit(
        {
          boundingBox: { top: 0, right: 0, bottom: 0, left: 50 },
          minimumPaneSizePercentage: 0,
        },
        { clientX: 600 },
      ),
    ).toEqual([20, 80]);
  });
});

describe('Split renderSplitHandle', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('renders nothing extra by default', () => {
    const { container } = render(
      React.createElement(Split, {
        direction: 'row',
        boundingBox: { top: 0, right: 0, bottom: 0, left: 0 },
        splitPercentages: [50, 50],
        splitIndex: 0,
      }),
    );
    expect(container.querySelector('.mosaic-split-handle')).toBeNull();
  });

  it('renders the handle for the split direction', () => {
    const renderSplitHandle = vi.fn((direction: string) =>
      React.createElement('span', { className: 'grip' }, direction),
    );
    const { container } = render(
      React.createElement(Split, {
        direction: 'column',
        boundingBox: { top: 0, right: 0, bottom: 0, left: 0 },
        splitPercentages: [50, 50],
        splitIndex: 0,
        renderSplitHandle,
      }),
    );
    const handle = container.querySelector(
      '.mosaic-split .mosaic-split-handle',
    );
    expect(handle?.textContent).toBe('column');
    expect(renderSplitHandle).toHaveBeenCalledWith('column');
  });

  it('drags the divider when pressed on the handle', () => {
    const onRelease = vi.fn();
    const { container } = render(
      React.createElement(
        'div',
        null,
        React.createElement(Split, {
          direction: 'row',
          boundingBox: { top: 0, right: 0, bottom: 0, left: 0 },
          splitPercentages: [50, 50],
          splitIndex: 0,
          onRelease,
          renderSplitHandle: () =>
            React.createElement('span', { className: 'grip' }, '⋮'),
        }),
      ),
    );
    const parent = container.firstElementChild as HTMLElement;
    vi.spyOn(parent, 'getBoundingClientRect').mockReturnValue({
      left: 0,
      top: 0,
      width: 1000,
      height: 500,
    } as DOMRect);

    fireEvent.mouseDown(container.querySelector('.grip') as HTMLElement, {
      button: 0,
    });
    expect(document.documentElement.classList.contains(RESIZING_CLASS)).toBe(
      true,
    );
    fireEvent.mouseUp(document, { clientX: 300 });

    expect(onRelease).toHaveBeenCalledWith([30, 70]);
  });
});
