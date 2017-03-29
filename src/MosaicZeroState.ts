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
import * as React from 'react';
import * as _ from 'lodash';
import { NonIdealStateFactory } from '@blueprintjs/core';
import * as PureRenderDecorator from 'pure-render-decorator';
import { CreateNode } from './types';
import { MosaicActionsPropType, MosaicContext } from './contextTypes';

const { button } = React.DOM;

export interface MosaicZeroStateProps<T> {
    createNode?: CreateNode<T>;
}

@PureRenderDecorator
class MosaicZeroStateComponentClass<T> extends React.Component<MosaicZeroStateProps<T>, void> {
    context: MosaicContext<T>;

    static contextTypes = {
        mosaicActions: MosaicActionsPropType
    };

    render() {
        return NonIdealStateFactory({
            visual: 'pt-icon-applications',
            className: 'mosaic-zero-state',
            title: 'No Windows Present',
            description: this.props.createNode && button({
                className: 'pt-button pt-icon-add',
                onClick: this.replace
            }, 'Add New Window')
        });
    }

    private replace = () =>
        Promise.resolve(this.props.createNode!())
            .then((node) => this.context.mosaicActions.replaceWith([], node))
            .catch(_.noop); // Swallow rejections (i.e. on user cancel)
}
export const MosaicZeroState: React.ComponentClass<MosaicZeroStateProps<any>> = MosaicZeroStateComponentClass;

// Factory that works with generics
export function MosaicZeroStateFactory<T>(props?: MosaicZeroStateProps<T> & React.Attributes, ...children: React.ReactNode[]) {
    const element: React.ReactElement<MosaicZeroStateProps<T>> = React.createElement(
        MosaicZeroStateComponentClass as React.ComponentClass<MosaicZeroStateProps<T>>, props, ...children);
    return element;
}
