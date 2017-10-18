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
import * as _ from 'lodash';
import * as React from 'react';
import { MosaicActionsPropType, MosaicContext, } from './contextTypes';
import { Split } from './Split';
import { MosaicBranch, MosaicDirection, MosaicKey, MosaicNode, ResizeOptions, TileRenderer, } from './types';
import { BoundingBox } from './util/BoundingBox';
import { isParent } from './util/mosaicUtilities';

export interface MosaicTileProps<T extends MosaicKey> {
  node: MosaicNode<T>;
  renderTile: TileRenderer<T>;
  resize?: ResizeOptions;
  className?: string;
}

function nonNullElement(x: JSX.Element | null): x is JSX.Element {
  return x !== null;
}

export class MosaicTile<T extends MosaicKey> extends React.Component<MosaicTileProps<T>> {
  context: MosaicContext<T>;

  static contextTypes = {
    mosaicActions: MosaicActionsPropType,
  };

  render() {
    const { node } = this.props;
    return this.renderRecursively(node, BoundingBox.empty(), []);
  }

  shouldComponentUpdate(nextProps: MosaicTileProps<T>) {
    // Deep equal for `boundingBox`
    return !_.isEqual(this.props, nextProps);
  }

  private renderRecursively(node: MosaicNode<T>, boundingBox: BoundingBox, path: MosaicBranch[]): JSX.Element[] {
    if (isParent(node)) {
      const splitPercentage = node.splitPercentage == null ? 50 : node.splitPercentage;
      const { first, splitter, second } = BoundingBox.split(boundingBox, splitPercentage, node.direction);
      return _.flatten([
        this.renderRecursively(node.first, first, path.concat('first')),
        this.renderSplit(node.direction, splitter, path),
        this.renderRecursively(node.second, second, path.concat('second')),
      ].filter(nonNullElement));
    } else {
      return [<div className='mosaic-tile'>{this.props.renderTile(node, path)}</div>];
    }
  }

  private renderSplit(direction: MosaicDirection, splitBoundingBox: BoundingBox, path: MosaicBranch[]) {
    const { resize } = this.props;
    if (resize !== 'DISABLED') {
      return (
        <Split
          {...resize}
          boundingBox={splitBoundingBox}
          direction={direction}
          onChange={(percentage) => this.onResize(percentage, path)}
        />
      );
    } else {
      return null;
    }
  }

  private onResize = (percentage: number, path: MosaicBranch[]) => {
    this.context.mosaicActions.updateTree([{
      path, spec: {
        splitPercentage: {
          $set: percentage,
        },
      },
    }]);
  };
}
