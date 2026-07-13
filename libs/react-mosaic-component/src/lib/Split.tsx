import classNames from 'classnames';
import { clamp, sum } from 'lodash-es';
import { throttle } from 'lodash-es';
import React from 'react';

import { EnabledResizeOptions, MosaicDirection } from './types';
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

export interface SplitProps extends EnabledResizeOptions {
  direction: MosaicDirection;
  // BoundingBox of the parent split container
  boundingBox: BoundingBox;
  // The full array of percentages for all siblings
  splitPercentages: number[];
  // The index of this splitter (e.g., index 0 is between child 0 and 1)
  splitIndex: number;
  // Callback provides the entire new array of percentages
  onChange?: (percentages: number[]) => void;
  onRelease?: (percentages: number[]) => void;
}

export class Split extends React.PureComponent<SplitProps> {
  private rootElement = React.createRef<HTMLDivElement>();
  private listenersBound = false;

  static defaultProps = {
    onChange: () => void 0,
    onRelease: () => void 0,
    minimumPaneSizePercentage: 10, // Updated default
  };

  render() {
    const { direction } = this.props;
    return (
      <div
        className={classNames('mosaic-split', {
          '-row': direction === 'row',
          '-column': direction === 'column',
        })}
        ref={this.rootElement}
        onMouseDown={this.onMouseDown}
        style={this.computeStyle()}
      >
        <div className="mosaic-split-line" />
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
    const { boundingBox, direction, splitPercentages, splitIndex } = this.props;

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
    };
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
    const newPercentages = this.calculateNewPercentages(event);
    this.props.onRelease!(newPercentages);
  };

  private onMouseMove = (event: MouseEvent | TouchEvent) => {
    event.preventDefault();
    this.throttledUpdatePercentage(event);
  };

  private throttledUpdatePercentage = throttle(
    (event: MouseEvent | TouchEvent) => {
      const newPercentages = this.calculateNewPercentages(event);
      this.props.onChange!(newPercentages);
    },
    RESIZE_THROTTLE_MS,
  );

  private calculateNewPercentages(event: MouseEvent | TouchEvent): number[] {
    const {
      minimumPaneSizePercentage,
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

    newLeftPaneSize = clamp(
      newLeftPaneSize,
      minimumPaneSizePercentage!,
      totalSizeOfPanes - minimumPaneSizePercentage!,
    );

    const newRightPaneSize = totalSizeOfPanes - newLeftPaneSize;

    const newSplitPercentages = [...splitPercentages];
    newSplitPercentages[splitIndex] = newLeftPaneSize;
    newSplitPercentages[splitIndex + 1] = newRightPaneSize;

    return newSplitPercentages;
  }

  // These bindings can remain as they were
  private bindListeners() {
    if (!this.listenersBound) {
      const doc = this.rootElement.current!.ownerDocument!;
      doc.addEventListener('mousemove', this.onMouseMove, true);
      doc.addEventListener('touchmove', this.onMouseMove, TOUCH_EVENT_OPTIONS);
      doc.addEventListener('mouseup', this.onMouseUp, true);
      doc.addEventListener('touchend', this.onMouseUp, true);
      this.listenersBound = true;
    }
  }

  private unbindListeners() {
    if (this.listenersBound && this.rootElement.current) {
      const doc = this.rootElement.current.ownerDocument!;
      doc.removeEventListener('mousemove', this.onMouseMove, true);
      doc.removeEventListener(
        'touchmove',
        this.onMouseMove,
        TOUCH_EVENT_OPTIONS,
      );
      doc.removeEventListener('mouseup', this.onMouseUp, true);
      doc.removeEventListener('touchend', this.onMouseUp, true);
      this.listenersBound = false;
    }
  }
}

function isTouchEvent(
  event: MouseEvent | TouchEvent | React.MouseEvent<any>,
): event is TouchEvent {
  return (event as TouchEvent).changedTouches != null;
}
