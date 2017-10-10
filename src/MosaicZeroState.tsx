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
import { MosaicActionsPropType, MosaicContext } from './contextTypes';
import { CreateNode } from './types';

export interface MosaicZeroStateProps<T> {
  createNode?: CreateNode<T>;
}

export class MosaicZeroState<T> extends React.PureComponent<MosaicZeroStateProps<T>> {
  context: MosaicContext<T>;

  static contextTypes = {
    mosaicActions: MosaicActionsPropType,
  };

  render() {
    return (
      <div className='mosaic-zero-state pt-non-ideal-state'>
        <div className='pt-non-ideal-state-visual pt-non-ideal-state-icon'>
          <span className='pt-icon pt-icon-applications'/>
        </div>
        <h4 className='pt-non-ideal-state-title'>No Windows Present</h4>
        <div className='pt-non-ideal-state-description'>
          {this.props.createNode && (
            <button
              className='pt-button pt-icon-add'
              onClick={this.replace}
            >
              Add New Window
            </button>
          )}
        </div>
      </div>
    );
  }

  private replace = () =>
    Promise.resolve(this.props.createNode!())
      .then((node) => this.context.mosaicActions.replaceWith([], node))
      .catch(_.noop); // Swallow rejections (i.e. on user cancel)
}

// Factory that works with generics
export function MosaicZeroStateFactory<T>(props?: MosaicZeroStateProps<T> & React.Attributes, ...children: React.ReactNode[]) {
  const element: React.ReactElement<MosaicZeroStateProps<T>> = React.createElement(
    MosaicZeroState as React.ComponentClass<MosaicZeroStateProps<T>>, props, ...children);
  return element;
}
