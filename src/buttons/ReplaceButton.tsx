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
import _ from 'lodash';
import React from 'react';
import { MosaicWindowContext } from '../contextTypes';
import { MosaicKey } from '../types';
import { createDefaultToolbarButton, MosaicButtonProps } from './MosaicButton';

export class ReplaceButton<T extends MosaicKey> extends React.PureComponent<MosaicButtonProps> {
  static contextTypes = MosaicWindowContext;
  context!: MosaicWindowContext<T>;

  render() {
    return createDefaultToolbarButton('Replace Window', 'pt-icon-exchange', this.replace);
  }

  private replace = () => {
    this.context.mosaicWindowActions
      .replaceWithNew()
      .then(() => {
        if (this.props.onClick) {
          this.props.onClick();
        }
      })
      .catch(_.noop); // Swallow rejections (i.e. on user cancel)
  };
}

export const ReplaceButtonFactory = React.createFactory(ReplaceButton);
