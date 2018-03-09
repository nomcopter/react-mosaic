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
import { MosaicContext } from './contextTypes';
import { Split } from './Split';
import { MosaicBranch, MosaicDirection, MosaicKey, MosaicNode, ResizeOptions, TileRenderer } from './types';
import { BoundingBox } from './util/BoundingBox';
import { isParent } from './util/mosaicUtilities';

export interface MosaicRootProps<T extends MosaicKey> {
  root: MosaicNode<T>;
  renderTile: TileRenderer<T>;
  resize?: ResizeOptions;
}

export class MosaicRoot<T extends MosaicKey> extends React.PureComponent<MosaicRootProps<T>> {
  static contextTypes = MosaicContext;
  context: MosaicContext<T>;

  render() {
    const { root } = this.props;
    return <div className="mosaic-root">{this.renderRecursively(root, BoundingBox.empty(), [])}</div>;
  }

  private renderRecursively(
    node: MosaicNode<T>,
    boundingBox: BoundingBox,
    path: MosaicBranch[],
  ): JSX.Element | JSX.Element[] {
    if (isParent(node)) {
      const splitPercentage = node.splitPercentage == null ? 50 : node.splitPercentage;
      const { first, second } = BoundingBox.split(boundingBox, splitPercentage, node.direction);
      return _.flatten(
        [
          this.renderRecursively(node.first, first, path.concat('first')),
          this.renderSplit(node.direction, boundingBox, splitPercentage, path),
          this.renderRecursively(node.second, second, path.concat('second')),
        ].filter(nonNullElement),
      );
    } else {
      return (
        <div key={node} className="mosaic-tile" style={{ ...BoundingBox.asStyles(boundingBox) }}>
          {this.props.renderTile(node, path)}
        </div>
      );
    }
  }

  private renderSplit(
    direction: MosaicDirection,
    boundingBox: BoundingBox,
    splitPercentage: number,
    path: MosaicBranch[],
  ) {
    const { resize } = this.props;
    if (resize !== 'DISABLED') {
      return (
        <Split
          key={path.join(',') + 'splitter'}
          {...resize}
          boundingBox={boundingBox}
          splitPercentage={splitPercentage}
          direction={direction}
          onChange={(percentage) => this.onResize(percentage, path)}
        />
      );
    } else {
      return null;
    }
  }

  private onResize = (percentage: number, path: MosaicBranch[]) => {
    this.context.mosaicActions.updateTree([
      {
        path,
        spec: {
          splitPercentage: {
            $set: percentage,
          },
        },
      },
    ]);
  };
}

function nonNullElement(x: JSX.Element | JSX.Element[] | null): x is JSX.Element | JSX.Element[] {
  return x !== null;
}
