import classNames from 'classnames';
import clamp from 'lodash/clamp';
import throttle from 'lodash/throttle';
import React from 'react';

import { EnabledResizeOptions, MosaicDirection } from './types';
import { BoundingBox } from './util/BoundingBox';

const RESIZE_THROTTLE_MS = 1000 / 30; // 30 fps

const TOUCH_EVENT_OPTIONS = {
  capture: true,
  passive: false,
};

export interface SplitProps extends EnabledResizeOptions {
  direction: MosaicDirection;
  boundingBox: BoundingBox;
  splitPercentage: number;
  onChange?: (percentOfParent: number) => void;
  onRelease?: (percentOfParent: number) => void;
}

export class Split extends React.PureComponent<SplitProps> {
  private rootElement = React.createRef<HTMLDivElement>();
  private listenersBound = false;

  static defaultProps = {
    onChange: () => void 0,
    onRelease: () => void 0,
    minimumPaneSizePercentage: 20,
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
    this.rootElement.current!.addEventListener('touchstart', this.onMouseDown, TOUCH_EVENT_OPTIONS);
  }

  componentWillUnmount() {
    this.unbindListeners();
    if (this.rootElement.current) {
      this.rootElement.current.ownerDocument!.removeEventListener('touchstart', this.onMouseDown, TOUCH_EVENT_OPTIONS);
    }
  }

  private bindListeners() {
    if (!this.listenersBound) {
      this.rootElement.current!.ownerDocument!.addEventListener('mousemove', this.onMouseMove, true);
      this.rootElement.current!.ownerDocument!.addEventListener('touchmove', this.onMouseMove, TOUCH_EVENT_OPTIONS);
      this.rootElement.current!.ownerDocument!.addEventListener('mouseup', this.onMouseUp, true);
      this.rootElement.current!.ownerDocument!.addEventListener('touchend', this.onMouseUp, true);
      this.listenersBound = true;
    }
  }

  private unbindListeners() {
    if (this.rootElement.current) {
      this.rootElement.current.ownerDocument!.removeEventListener('mousemove', this.onMouseMove, true);
      this.rootElement.current.ownerDocument!.removeEventListener('touchmove', this.onMouseMove, TOUCH_EVENT_OPTIONS);
      this.rootElement.current.ownerDocument!.removeEventListener('mouseup', this.onMouseUp, true);
      this.rootElement.current.ownerDocument!.removeEventListener('touchend', this.onMouseUp, true);
      this.listenersBound = false;
    }
  }

  private computeStyle() {
    const { boundingBox, direction, splitPercentage } = this.props;
    const positionStyle = direction === 'column' ? 'top' : 'left';
    const absolutePercentage = BoundingBox.getAbsoluteSplitPercentage(boundingBox, splitPercentage, direction);
    return {
      ...BoundingBox.asStyles(boundingBox),
      [positionStyle]: `${absolutePercentage}%`,
    };
  }

  private onMouseDown = (event: React.MouseEvent<HTMLDivElement> | TouchEvent) => {
    if (!isTouchEvent(event)) {
      if (event.button !== 0) {
        return;
      }
    }

    event.preventDefault();
    this.bindListeners();
  };

  private onMouseUp = (event: MouseEvent | TouchEvent) => {
    this.unbindListeners();

    const percentage = this.calculateRelativePercentage(event);
    this.props.onRelease!(percentage);
  };

  private onMouseMove = (event: MouseEvent | TouchEvent) => {
    event.preventDefault();
    event.stopPropagation();

    this.throttledUpdatePercentage(event);
  };

  private throttledUpdatePercentage = throttle((event: MouseEvent | TouchEvent) => {
    const percentage = this.calculateRelativePercentage(event);
    if (percentage !== this.props.splitPercentage) {
      this.props.onChange!(percentage);
    }
  }, RESIZE_THROTTLE_MS);

  private calculateRelativePercentage(event: MouseEvent | TouchEvent): number {
    const { minimumPaneSizePercentage, direction, boundingBox } = this.props;
    const parentBBox = this.rootElement.current!.parentElement!.getBoundingClientRect();
    const location = isTouchEvent(event) ? event.changedTouches[0] : event;

    let absolutePercentage: number;
    if (direction === 'column') {
      absolutePercentage = ((location.clientY - parentBBox.top) / parentBBox.height) * 100.0;
    } else {
      absolutePercentage = ((location.clientX - parentBBox.left) / parentBBox.width) * 100.0;
    }

    const relativePercentage = BoundingBox.getRelativeSplitPercentage(boundingBox, absolutePercentage, direction);

    return clamp(relativePercentage, minimumPaneSizePercentage!, 100 - minimumPaneSizePercentage!);
  }
}

function isTouchEvent(event: MouseEvent | TouchEvent | React.MouseEvent<any>): event is TouchEvent {
  return (event as TouchEvent).changedTouches != null;
}
