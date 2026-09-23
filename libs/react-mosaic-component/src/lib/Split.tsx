import classNames from 'classnames';
import { clamp, sum } from 'lodash-es';
import { throttle } from 'lodash-es';
import React from 'react';

import {
  EnabledResizeOptions,
  MosaicDirection,
  ResizeValueByDirection,
} from './types';
import {
  BoundingBox,
  boundingBoxAsStyles,
  getAbsoluteSplitPercentage,
  getRelativeSplitPercentage,
} from './util/BoundingBox';

const RESIZE_THROTTLE_MS = 1000 / 30; // 30 fps

const TOUCH_EVENT_OPTIONS = {
  capture: true,
  passive: false,
};

// Set on <html> while a split is dragged. The stylesheet turns off pointer
// events on tiles, so iframes and nested apps inside them can't swallow the
// mousemove/mouseup the drag depends on.
export const RESIZING_CLASS = 'mosaic-resizing';

export const DEFAULT_MINIMUM_PANE_SIZE_PERCENTAGE = 10;

// z-index of a root-level divider with a handle; deeper ones get one less
const HANDLE_MAX_Z_INDEX = 9;

export interface SplitProps extends EnabledResizeOptions {
  direction: MosaicDirection;
  // BoundingBox of the parent split container
  boundingBox: BoundingBox;
  // The full array of percentages for all siblings
  splitPercentages: number[];
  // The index of this splitter (e.g., index 0 is between child 0 and 1)
  splitIndex: number;
  // How deep the parent split is in the tree (0 for the root split)
  depth?: number;
  // Callback provides the entire new array of percentages
  onChange?: (percentages: number[]) => void;
  onRelease?: (percentages: number[]) => void;
}

interface SplitState {
  // Where the divider is drawn during a `preview` drag, before the tree changes
  previewPercentages: number[] | null;
}

export class Split extends React.PureComponent<SplitProps, SplitState> {
  private rootElement = React.createRef<HTMLDivElement>();
  private boundDocument: Document | null = null;
  // Last percentages reported through onChange during the current drag
  private lastPercentages: number[] | null = null;

  static defaultProps = {
    onChange: () => void 0,
    onRelease: () => void 0,
  };

  state: SplitState = {
    previewPercentages: null,
  };

  render() {
    const { direction, renderSplitHandle } = this.props;
    return (
      <div
        className={classNames('mosaic-split', {
          '-row': direction === 'row',
          '-column': direction === 'column',
          '-preview': this.state.previewPercentages !== null,
        })}
        ref={this.rootElement}
        onMouseDown={this.onMouseDown}
        style={this.computeStyle()}
      >
        <div className="mosaic-split-line" />
        {renderSplitHandle && (
          <div className="mosaic-split-handle">
            {renderSplitHandle(direction)}
          </div>
        )}
      </div>
    );
  }

  componentDidMount() {
    this.rootElement.current!.addEventListener(
      'touchstart',
      this.onMouseDown,
      TOUCH_EVENT_OPTIONS,
    );
  }

  componentWillUnmount() {
    this.unbindListeners();
    this.throttledUpdatePercentage.cancel();
    if (this.rootElement.current) {
      // Must match the addEventListener target in componentDidMount — the
      // listener is on the element itself, not its document.
      this.rootElement.current.removeEventListener(
        'touchstart',
        this.onMouseDown,
        TOUCH_EVENT_OPTIONS,
      );
    }
  }

  private computeStyle() {
    const { boundingBox, direction, splitIndex } = this.props;
    const splitPercentages =
      this.state.previewPercentages ?? this.props.splitPercentages;

    // The position is the sum of all pane percentages before this splitter
    const relativeSplitterPosition = sum(
      splitPercentages.slice(0, splitIndex + 1),
    );

    // Convert the relative percentage to an absolute one within the parent's bounding box
    const absolutePercentage = getAbsoluteSplitPercentage(
      boundingBox,
      relativeSplitterPosition,
      direction,
    );

    const positionStyle = direction === 'column' ? 'top' : 'left';
    return {
      ...boundingBoxAsStyles(boundingBox),
      [positionStyle]: `${absolutePercentage}%`,
      zIndex: this.getHandleZIndex(),
    };
  }

  // A handle sits in the middle of its divider, which is often exactly where
  // an inner divider meets it (every 2x2 grid). Stacking outer dividers above
  // inner ones keeps the handle grabbable there. Only applied when handles are
  // rendered, and kept below the -preview z-index of 10.
  private getHandleZIndex(): number | undefined {
    const { renderSplitHandle, depth } = this.props;
    if (
      !renderSplitHandle ||
      depth === undefined ||
      this.state.previewPercentages !== null
    ) {
      return undefined;
    }
    return Math.max(1, HANDLE_MAX_Z_INDEX - depth);
  }

  private onMouseDown = (
    event: React.MouseEvent<HTMLDivElement> | TouchEvent,
  ) => {
    if (!isTouchEvent(event) && event.button !== 0) return;
    event.preventDefault();
    this.bindListeners();
  };

  private onMouseUp = (event: MouseEvent | TouchEvent) => {
    this.unbindListeners();
    // A queued trailing call would otherwise deliver onChange after onRelease.
    this.throttledUpdatePercentage.cancel();
    this.lastPercentages = null;
    const newPercentages = this.calculateNewPercentages(event);
    this.props.onRelease!(newPercentages);
    // Cleared after onRelease so the divider doesn't jump back to its old
    // position for a frame before the new tree arrives
    if (this.state.previewPercentages !== null) {
      this.setState({ previewPercentages: null });
    }
  };

  private onMouseMove = (event: MouseEvent | TouchEvent) => {
    // No button held means the mouseup never reached us (e.g. it happened
    // outside the window), so the drag is already over.
    if (!isTouchEvent(event) && event.buttons === 0) {
      this.abortDrag();
      return;
    }
    event.preventDefault();
    this.throttledUpdatePercentage(event);
  };

  // Ends a drag whose mouseup was lost (window blur, alert, context menu), so
  // the resizing class doesn't leave every tile unclickable. The divider stays
  // where it was last drawn: a pending move is flushed, and if the drag already
  // reported onChange, onRelease follows with the same percentages so every
  // onChange is still followed by an onRelease.
  private abortDrag = () => {
    this.unbindListeners();
    this.throttledUpdatePercentage.flush();
    const lastPercentages = this.lastPercentages;
    this.lastPercentages = null;
    if (lastPercentages) {
      this.props.onRelease?.(lastPercentages);
    }
    if (this.state.previewPercentages !== null) {
      this.setState({ previewPercentages: null });
    }
  };

  private throttledUpdatePercentage = throttle(
    (event: MouseEvent | TouchEvent) => {
      const newPercentages = this.calculateNewPercentages(event);
      this.lastPercentages = newPercentages;
      if (this.props.preview) {
        // Only the divider moves; the tree changes once, on release
        this.setState({ previewPercentages: newPercentages });
      } else {
        this.props.onChange!(newPercentages);
      }
    },
    RESIZE_THROTTLE_MS,
  );

  private calculateNewPercentages(event: MouseEvent | TouchEvent): number[] {
    const {
      minimumPaneSizePercentage,
      minimumPaneSizePx,
      direction,
      boundingBox,
      splitPercentages,
      splitIndex,
    } = this.props;

    // The split can be unmounted or detached from the DOM mid-drag (e.g. the
    // layout changed under us). Bail out with the current percentages rather
    // than throwing on a missing rootElement/parentElement.
    if (!this.rootElement.current || !this.rootElement.current.parentElement) {
      return splitPercentages;
    }

    // We need the parent element that this split is rendered into, which is `.mosaic-root`
    const parentBBox =
      this.rootElement.current.parentElement.getBoundingClientRect();
    const location = isTouchEvent(event) ? event.changedTouches[0] : event;

    // A root with no size (e.g. hidden) would turn the maths below into NaN
    if (parentBBox.width === 0 || parentBBox.height === 0) {
      return splitPercentages;
    }

    let mouseAbsolutePercentage: number;
    if (direction === 'column') {
      mouseAbsolutePercentage =
        ((location.clientY - parentBBox.top) / parentBBox.height) * 100.0;
    } else {
      mouseAbsolutePercentage =
        ((location.clientX - parentBBox.left) / parentBBox.width) * 100.0;
    }

    // Convert the absolute mouse percentage to one relative to this split's bounding box
    const mouseRelativePercentage = getRelativeSplitPercentage(
      boundingBox,
      mouseAbsolutePercentage,
      direction,
    );

    const startPercentage = sum(splitPercentages.slice(0, splitIndex));
    const totalSizeOfPanes =
      splitPercentages[splitIndex] + splitPercentages[splitIndex + 1];

    let newLeftPaneSize = mouseRelativePercentage - startPercentage;

    // Pixel size of this split along its direction, to express the pixel
    // minimum as a percentage of the split
    const { top, right, bottom, left } = boundingBox;
    const splitSizePx =
      direction === 'column'
        ? (parentBBox.height * (100 - top - bottom)) / 100
        : (parentBBox.width * (100 - left - right)) / 100;
    const minimumPx = resolveByDirection(minimumPaneSizePx, direction, 0);
    const minimumPxAsPercentage =
      splitSizePx > 0 ? (minimumPx / splitSizePx) * 100 : 0;

    // The larger minimum wins. It can't exceed half of the two panes, or
    // they couldn't both satisfy it and one would end up negative.
    const minimumPaneSize = Math.min(
      Math.max(
        resolveByDirection(
          minimumPaneSizePercentage,
          direction,
          DEFAULT_MINIMUM_PANE_SIZE_PERCENTAGE,
        ),
        minimumPxAsPercentage,
      ),
      totalSizeOfPanes / 2,
    );

    newLeftPaneSize = clamp(
      newLeftPaneSize,
      minimumPaneSize,
      totalSizeOfPanes - minimumPaneSize,
    );

    const newRightPaneSize = totalSizeOfPanes - newLeftPaneSize;

    const newSplitPercentages = [...splitPercentages];
    newSplitPercentages[splitIndex] = newLeftPaneSize;
    newSplitPercentages[splitIndex + 1] = newRightPaneSize;

    return newSplitPercentages;
  }

  private bindListeners() {
    if (!this.boundDocument && this.rootElement.current) {
      const doc = this.rootElement.current.ownerDocument;
      doc.addEventListener('mousemove', this.onMouseMove, true);
      doc.addEventListener('touchmove', this.onMouseMove, TOUCH_EVENT_OPTIONS);
      doc.addEventListener('mouseup', this.onMouseUp, true);
      doc.addEventListener('touchend', this.onMouseUp, true);
      doc.addEventListener('touchcancel', this.onMouseUp, true);
      doc.defaultView?.addEventListener('blur', this.abortDrag);
      doc.documentElement.classList.add(
        RESIZING_CLASS,
        `${RESIZING_CLASS}-${this.props.direction}`,
      );
      this.boundDocument = doc;
      this.lastPercentages = null;
    }
  }

  // Uses the document captured at bind time, so cleanup still happens when
  // the root element is already gone.
  private unbindListeners() {
    const doc = this.boundDocument;
    if (doc) {
      doc.removeEventListener('mousemove', this.onMouseMove, true);
      doc.removeEventListener(
        'touchmove',
        this.onMouseMove,
        TOUCH_EVENT_OPTIONS,
      );
      doc.removeEventListener('mouseup', this.onMouseUp, true);
      doc.removeEventListener('touchend', this.onMouseUp, true);
      doc.removeEventListener('touchcancel', this.onMouseUp, true);
      doc.defaultView?.removeEventListener('blur', this.abortDrag);
      doc.documentElement.classList.remove(
        RESIZING_CLASS,
        `${RESIZING_CLASS}-row`,
        `${RESIZING_CLASS}-column`,
      );
      this.boundDocument = null;
    }
  }
}

export function resolveByDirection(
  value: ResizeValueByDirection | undefined,
  direction: MosaicDirection,
  fallback: number,
): number {
  if (typeof value === 'number') {
    return value;
  }
  return value?.[direction] ?? fallback;
}

function isTouchEvent(
  event: MouseEvent | TouchEvent | React.MouseEvent<any>,
): event is TouchEvent {
  return (event as TouchEvent).changedTouches != null;
}
