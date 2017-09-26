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
import * as React from 'react';
import { MosaicActionsPropType, MosaicContext, MosaicPathGetterPropType, MosaicTileContext } from './contextTypes';
import { isParent } from './mosaicUtilities';
import { Split } from './Split';
import { MosaicNode, MosaicParent, MosaicPath, MosaicUpdateSpec, ResizeOptions, TileRenderer } from './types';

export interface MosaicTileProps<T> {
  node: MosaicNode<T>;
  renderTile: TileRenderer<T>;
  resize?: ResizeOptions;
  getPath: () => MosaicPath;
  className?: string;
}

export class MosaicTile<T> extends React.PureComponent<MosaicTileProps<T>> {
  context: MosaicContext<T>;

  static contextTypes = {
    mosaicActions: MosaicActionsPropType,
  };

  static childContextTypes = {
    getMosaicPath: MosaicPathGetterPropType,
  };

  private MosaicTileT = class extends MosaicTile<T> {
  };

  getChildContext(): Partial<MosaicTileContext<T>> {
    return {
      getMosaicPath: this.props.getPath,
    };
  }

  render(): JSX.Element {
    const { node, renderTile, resize } = this.props;

    if (isParent(node)) {
      const splitPercentage = node.splitPercentage == null ? 50 : node.splitPercentage;
      const sizeStyle = node.direction === 'column' ? 'height' : 'width';
      return (
        <div
          className={classNames('mosaic-tile', this.props.className, {
            '-column': node.direction === 'column',
            '-row': node.direction === 'row',
          })}
        >
          <div
            className='mosaic-branch -first'
            style={{
              [sizeStyle]: `${splitPercentage}%`,
            }}
          >
            <this.MosaicTileT
              renderTile={renderTile}
              resize={resize}
              node={node.first}
              getPath={this.getFirstBranchPath}
            />
          </div>
          {this.renderSplit(node, splitPercentage)}
          <div
            className='mosaic-branch -second'
            style={{
              [sizeStyle]: `${100 - splitPercentage}%`,
            }}
          >
            <this.MosaicTileT
              renderTile={renderTile}
              resize={resize}
              node={node.second}
              getPath={this.getSecondBranchPath}
            />
          </div>
        </div>
      );
    } else {
      return renderTile(node);
    }
  }

  private renderSplit(node: MosaicParent<T>, splitPercentage: number) {
    const { resize } = this.props;
    if (resize !== 'DISABLED') {
      return (
        <Split
          {...resize}
          splitPercentage={splitPercentage}
          direction={node.direction}
          onChange={this.onResize}
        />
      );
    } else {
      return null;
    }
  }

  private replaceWith = (spec: MosaicUpdateSpec<T>) =>
    this.context.mosaicActions.updateTree([{
      path: this.props.getPath(),
      spec,
    }]);

  private onResize = (percentage: number) => {
    this.replaceWith({
      splitPercentage: {
        $set: percentage,
      },
    });
  };

  private getFirstBranchPath = () => this.props.getPath().concat('first');
  private getSecondBranchPath = () => this.props.getPath().concat('second');
}
