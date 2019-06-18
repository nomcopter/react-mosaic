import classNames from 'classnames';
import clamp from 'lodash/clamp';
import throttle from 'lodash/throttle';
import React from 'react';

import { EnabledResizeOptions, MosaicDirection } from './types';
import { BoundingBox } from './util/BoundingBox';

const RESIZE_THROTTLE_MS = 1000 / 30; // 30 fps

export interface SplitProps extends EnabledResizeOptions {
  direction: MosaicDirection;
  boundingBox: BoundingBox;
  splitPercentage: number;
  onChange?: (percentOfParent: number) => void;
  onRelease?: (percentOfParent: number) => void;
}

export class Split extends React.PureComponent<SplitProps> {
  private rootElement: HTMLDivElement | null = null;
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
        ref={(el) => (this.rootElement = el)}
        onMouseDown={this.onMouseDown}
        onTouchStart={this.onMouseDown}
        style={this.computeStyle()}
      >
        <div className="mosaic-split-line" />
      </div>
    );
  }

  componentWillUnmount() {
    this.unbindListeners();
  }

  private bindListeners() {
    if (!this.listenersBound) {
      this.rootElement!.ownerDocument!.addEventListener('mousemove', this.onMouseMove, true);
      this.rootElement!.ownerDocument!.addEventListener('touchmove', this.onMouseMove, true);
      this.rootElement!.ownerDocument!.addEventListener('mouseup', this.onMouseUp, true);
      this.rootElement!.ownerDocument!.addEventListener('touchend', this.onMouseUp, true);
      this.listenersBound = true;
    }
  }

  private unbindListeners() {
    if (this.rootElement) {
      this.rootElement.ownerDocument!.removeEventListener('mousemove', this.onMouseMove, true);
      this.rootElement.ownerDocument!.removeEventListener('touchmove', this.onMouseMove, true);
      this.rootElement.ownerDocument!.removeEventListener('mouseup', this.onMouseUp, true);
      this.rootElement.ownerDocument!.removeEventListener('touchend', this.onMouseUp, true);
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

  private onMouseDown = (event: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if (!isTouchEvent(event)) {
      if (event.button !== 0) {
        return;
      }
    }

    preventDefaultIfMouseEvent(event);

    this.bindListeners();
  };

  private onMouseUp = (event: MouseEvent | TouchEvent) => {
    this.unbindListeners();

    const percentage = this.calculateRelativePercentage(event);
    this.props.onRelease!(percentage);
  };

  private onMouseMove = throttle((event: MouseEvent | TouchEvent) => {
    preventDefaultIfMouseEvent(event);
    event.stopPropagation();

    const percentage = this.calculateRelativePercentage(event);
    if (percentage !== this.props.splitPercentage) {
      this.props.onChange!(percentage);
    }
  }, RESIZE_THROTTLE_MS);

  private calculateRelativePercentage(event: MouseEvent | TouchEvent): number {
    const { minimumPaneSizePercentage, direction, boundingBox } = this.props;
    const parentBBox = this.rootElement!.parentElement!.getBoundingClientRect();
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

function isTouchEvent<T>(event: MouseEvent | TouchEvent): event is TouchEvent;
function isTouchEvent<T>(event: React.MouseEvent<T> | React.TouchEvent<T>): event is React.TouchEvent<T>;
function isTouchEvent(
  event: MouseEvent | TouchEvent | React.MouseEvent<any> | React.TouchEvent<any>,
): event is TouchEvent {
  return (event as TouchEvent).changedTouches != null;
}

function preventDefaultIfMouseEvent(event: MouseEvent | TouchEvent | React.MouseEvent<any> | React.TouchEvent<any>) {
  // any cast https://github.com/Microsoft/TypeScript/issues/14107
  if (!isTouchEvent(event as any)) {
    event.preventDefault();
  }
}
