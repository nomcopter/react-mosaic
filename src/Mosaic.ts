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
import * as classNames from 'classnames';
import { DragDropContext } from 'react-dnd';
import HTML5 from 'react-dnd-html5-backend';
import * as PureRenderDecorator from 'pure-render-decorator';
import { MosaicDropTargetPosition, MosaicNode, MosaicPath, MosaicUpdate, TileRenderer } from './types';
import { MosaicTile } from './MosaicTile';
import { MosaicZeroStateFactory } from './MosaicZeroState';
import { createExpandUpdate, createHideUpdate, createRemoveUpdate, updateTree } from './mosaicUpdates';
import { MosaicWindowDropTarget } from './MosaicDropTarget';
import { MosaicActionsPropType, MosaicContext, MosaicRootActions } from './contextTypes';

const { div } = React.DOM;
const DEFAULT_EXPAND_PERCENTAGE = 70;

export interface MosaicBaseProps<T> {
    /**
     * Lookup function to convert `T` to a displayable `ReactElement`
     */
    renderTile: TileRenderer<T>;
    /**
     * Called when a user initiates any change to the tree (removing, adding, moving, resizing, etc.)
     */
    onChange?: (newNode: MosaicNode<T> | null) => void;
    /**
     * Additional classes to affix to the root element
     * Default: 'mosaic-blueprint-theme'
     */
    className?: string;
    /**
     * Whether the panes should be resizeable
     * default: true
     */
    resizeable?: boolean;
    /**
     * View to display when the current value is `null`
     * default: Simple NonIdealState view
     */
    zeroStateView?: React.ReactElement<any>;
}

export interface MosaicControlledProps<T> extends MosaicBaseProps<T> {
    /**
     * The tree to render
     */
    value: MosaicNode<T> | null;
    onChange: (newNode: MosaicNode<T> | null) => void;
}

export interface MosaicUncontrolledProps<T> extends MosaicBaseProps<T> {
    /**
     * The initial tree to render, can be modified by the user
     */
    initialValue: MosaicNode<T> | null;
}

export type MosaicProps<T> = MosaicControlledProps<T> | MosaicUncontrolledProps<T>;

function isUncontrolled<T>(props: MosaicProps<T>): props is MosaicUncontrolledProps<T> {
    return (props as MosaicUncontrolledProps<T>).initialValue != null;
}

interface State<T> {
    currentNode: MosaicNode<T> | null;
}

@(DragDropContext(HTML5) as ClassDecorator)
@PureRenderDecorator
class MosaicComponentClass<T> extends React.Component<MosaicProps<T>, State<T>> {
    static defaultProps = {
        onChange: () => void 0,
        resizeable: true,
        zeroStateView: MosaicZeroStateFactory(),
        className: 'mosaic-blueprint-theme'
    } as any;

    static childContextTypes = {
        mosaicActions: MosaicActionsPropType
    };

    getChildContext(): MosaicContext<T> {
        return {
            mosaicActions: this.actions
        }
    }

    state: State<T> = {
        currentNode: null
    };

    render() {
        const { className, renderTile, resizeable, zeroStateView } = this.props;
        const node = this.getRoot();

        return div({
                className: classNames(className, 'mosaic-root mosaic-drop-target'),
            },
            node == null ?
                zeroStateView :
                MosaicTile<T>({
                    node, renderTile,
                    resizeable: resizeable!,
                    getPath: this.getPath
                }),
            div({ className: 'drop-target-container' },
                _.values<string>(MosaicDropTargetPosition).map((position) =>
                    MosaicWindowDropTarget({
                        position,
                        path: [],
                        key: position
                    })
                )
            )
        );
    }

    private getRoot(): MosaicNode<T> | null {
        const props: MosaicProps<T> = this.props;
        if (isUncontrolled(props)) {
            return this.state.currentNode!;
        } else {
            return props.value;
        }
    }

    private getPath = (): MosaicPath => [];

    private updateRoot = (updates: MosaicUpdate<T>[]) => {
        let currentNode = this.getRoot() || {} as MosaicNode<T>;

        this.replaceRoot(updateTree(currentNode, updates));
    };

    private replaceRoot = (currentNode: MosaicNode<T> | null) => {
        this.props.onChange!(currentNode);

        if (isUncontrolled(this.props)) {
            this.setState({ currentNode });
        }
    };

    private actions: MosaicRootActions<T> = {
        updateTree: this.updateRoot,
        remove: (path: MosaicPath) => {
            if (path.length === 0) {
                this.replaceRoot(null);
            } else {
                this.updateRoot([createRemoveUpdate(this.getRoot(), path)]);
            }
        },
        expand: (path: MosaicPath, percentage: number = DEFAULT_EXPAND_PERCENTAGE) =>
            this.updateRoot([createExpandUpdate<T>(path, percentage)]),
        getRoot: () => this.getRoot()!,
        hide: (path: MosaicPath) =>
            this.updateRoot([createHideUpdate<T>(path)]),
        replaceWith: (path: MosaicPath, newNode: MosaicNode<T>) =>
            this.updateRoot([{
                path,
                spec: {
                    $set: newNode
                }
            }])
    };

    componentWillReceiveProps(nextProps: MosaicProps<T>) {
        if (isUncontrolled(nextProps) &&
            nextProps.initialValue !== (this.props as MosaicUncontrolledProps<T>).initialValue) {

            this.setState({ currentNode: nextProps.initialValue });
        }
    }

    componentWillMount() {
        const props: MosaicProps<T> = this.props;
        if (isUncontrolled(props)) {
            this.setState({ currentNode: props.initialValue });
        }
    }
}
export const Mosaic: React.ComponentClass<MosaicProps<any>> = MosaicComponentClass;

// Factory that works with generics
export function MosaicFactory<T>(props: MosaicProps<T> & React.Attributes, ...children: React.ReactNode[]) {
    const element: React.ReactElement<MosaicProps<T>> =
        React.createElement(MosaicComponentClass as React.ComponentClass<MosaicProps<T>>, props, ...children);
    return element;
}
