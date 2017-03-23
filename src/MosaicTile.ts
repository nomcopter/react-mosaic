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
import * as classNames from 'classnames';
import * as PureRenderDecorator from 'pure-render-decorator';
import { MosaicNode, ElementRetriever, MosaicUpdateSpec, MosaicPath } from './types';
import { Split } from './Split';
import { isParent } from './mosaicUtilities';
import { MosaicContext, MosaicActionsPropType, MosaicPathGetterPropType, MosaicTileContext } from './contextTypes';

const { div } = React.DOM;

export interface MosaicTileProps<T> {
    node: MosaicNode<T>;
    elementRetriever: ElementRetriever<T>;
    resizeable: boolean;
    getPath: () => MosaicPath;
    className?: string;
}

@PureRenderDecorator
class MosaicTileClass<T> extends React.Component<MosaicTileProps<T>, void> {
    context: MosaicContext<T>;

    static contextTypes = {
        mosaicActions: MosaicActionsPropType
    };

    static childContextTypes = {
        getMosaicPath: MosaicPathGetterPropType
    };

    getChildContext(): Partial<MosaicTileContext<T>> {
        return {
            getMosaicPath: this.props.getPath
        }
    }

    render(): JSX.Element {
        const { node, elementRetriever, resizeable } = this.props;

        if (isParent(node)) {
            const splitPercentage = node.splitPercentage == null ? 50 : node.splitPercentage;
            const sizeStyle = node.direction === 'column' ? 'height' : 'width';
            return div({
                    className: classNames('mosaic-tile', this.props.className, {
                        '-column': node.direction === 'column',
                        '-row': node.direction === 'row'
                    })
                },
                div({
                        className: 'mosaic-branch -first',
                        style: {
                            [sizeStyle]: `${splitPercentage}%`
                        }
                    },
                    MosaicTile<T>({
                        elementRetriever, resizeable,
                        node: node.first,
                        getPath: this.getFirstBranchPath
                    })),
                resizeable && Split({
                    splitPercentage,
                    direction: node.direction,
                    onChange: this.onResize
                }),
                div({
                        className: 'mosaic-branch -second',
                        style: {
                            [sizeStyle]: `${100 - splitPercentage}%`
                        }
                    },
                    MosaicTile<T>({
                        elementRetriever, resizeable,
                        node: node.second,
                        getPath: this.getSecondBranchPath
                    }))
            );
        } else {
            return elementRetriever(node);
        }
    }

    private replaceWith = (spec: MosaicUpdateSpec<T>) =>
        this.context.mosaicActions.updateTree([{
            path: this.props.getPath(),
            spec
        }]);

    private onResize = (percentage: number) => {
        this.replaceWith({
            splitPercentage: {
                $set: percentage
            }
        });
    };

    private getFirstBranchPath = () => this.props.getPath().concat('first');
    private getSecondBranchPath = () => this.props.getPath().concat('second');
}

// Factory that works with generics
export function MosaicTile<T>(props: MosaicTileProps<T> & React.Attributes, ...children: React.ReactNode[]) {
    const element: React.ReactElement<MosaicTileProps<T>> =
        React.createElement(MosaicTileClass, props, ...children);
    return element;
}
