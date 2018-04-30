/**
 * @license
 * Copyright 2016 Palantir Technologies, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import * as classNames from 'classnames';
import * as _ from 'lodash';
import * as React from 'react';
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
  private rootElement: HTMLElement | null = null;

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
        style={this.computeStyle()}
      >
        <div className="mosaic-split-line" />
      </div>
    );
  }

  componentWillUnmount() {
    document.removeEventListener('mousemove', this.onMouseMove, true);
    document.removeEventListener('mouseup', this.onMouseUp, true);
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

  private onMouseDown = (event: React.MouseEvent<HTMLElement>) => {
    if (event.button !== 0) {
      return;
    }

    event.preventDefault();
    document.addEventListener('mousemove', this.onMouseMove, true);
    document.addEventListener('mouseup', this.onMouseUp, true);
  };

  private onMouseUp = (event: MouseEvent) => {
    document.removeEventListener('mousemove', this.onMouseMove, true);
    document.removeEventListener('mouseup', this.onMouseUp, true);

    const percentage = this.calculateRelativePercentage(event);
    if (percentage !== this.props.splitPercentage) {
      this.props.onRelease!(percentage);
    }
  };

  private onMouseMove = _.throttle((event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

    const percentage = this.calculateRelativePercentage(event);
    if (percentage !== this.props.splitPercentage) {
      this.props.onChange!(percentage);
    }
  }, RESIZE_THROTTLE_MS);

  private calculateRelativePercentage(event: MouseEvent): number {
    const { minimumPaneSizePercentage, direction, boundingBox } = this.props;
    const parentBBox = this.rootElement!.parentElement!.getBoundingClientRect();

    let absolutePercentage: number;
    if (direction === 'column') {
      absolutePercentage = (event.clientY - parentBBox.top) / parentBBox.height * 100.0;
    } else {
      absolutePercentage = (event.clientX - parentBBox.left) / parentBBox.width * 100.0;
    }

    const relativePercentage = BoundingBox.getRelativeSplitPercentage(boundingBox, absolutePercentage, direction);

    return _.clamp(relativePercentage, minimumPaneSizePercentage!, 100 - minimumPaneSizePercentage!);
  }
}
