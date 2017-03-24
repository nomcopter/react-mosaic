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
import * as PureRenderDecorator from 'pure-render-decorator';
import { ConnectDragPreview, ConnectDragSource, ConnectDropTarget, DragSource, DropTarget } from 'react-dnd';
import { CreateNode, MosaicDirection, MosaicDragType, MosaicDropData, MosaicDropTargetPosition } from '../types';
import { MosaicWindowDropTarget } from '../MosaicDropTarget';
import {
    DEFAULT_CONTROLS_WITH_CREATION,
    DEFAULT_CONTROLS_WITHOUT_CREATION,
    SeparatorFactory
} from './defaultToolbarControls';
import { getAndAssertNodeAtPathExists } from '../mosaicUtilities';
import { createDragToUpdates } from '../mosaicUpdates';
import { MosaicTileContext, MosaicWindowActionsPropType, MosaicWindowContext } from '../contextTypes';
import DragSourceMonitor = __ReactDnd.DragSourceMonitor;

const { div, span, button, h4 } = React.DOM;

export interface MosaicWindowProps<T> {
    title: string;
    className?: string;
    toolbarControls?: React.ReactElement<any>[];
    additionalControls?: React.ReactElement<any>[];
    additionalControlButtonText?: string;
    draggable?: boolean;
    createNode?: CreateNode<T>;
}

interface DragSourceProps {
    connectDragSource: ConnectDragSource;
    connectDragPreview: ConnectDragPreview;
}

interface DropTargetProps {
    connectDropTarget: ConnectDropTarget;
    isOver: boolean;
}

type Props<T> = MosaicWindowProps<T> & DropTargetProps & DragSourceProps;

interface State {
    additionalControlsOpen: boolean;
}

interface DragDropContainerComponent extends React.Component<any, any> {
    getDecoratedComponentInstance: () => MosaicWindowComponentClass<any>;
}

const dragSource = {
    beginDrag: (props: Props<any>, monitor: DragSourceMonitor, component: DragDropContainerComponent) => {
        const context = component.getDecoratedComponentInstance().context;
        // The defer is necessary as the element must be present on start for HTML DnD to not cry
        _.defer(() => context.mosaicActions.hide(context.getMosaicPath()));
        return {};
    },
    endDrag: (props: Props<any>, monitor: DragSourceMonitor, component: DragDropContainerComponent) => {
        const context = component.getDecoratedComponentInstance().context;
        const path = context.getMosaicPath();
        const dropResult: MosaicDropData = (monitor.getDropResult() || {}) as MosaicDropData;
        const { position, path: destinationPath } = dropResult;
        if (position != null && destinationPath != null) {
            context.mosaicActions.updateTree(
                createDragToUpdates(context.mosaicActions.getRoot(), path, destinationPath, position));
        } else {
            context.mosaicActions.updateTree([{
                path: _.dropRight(path),
                spec: {
                    splitPercentage: {
                        $set: null
                    }
                }
            }]);
        }
    }
};

const dropTarget = {};

@(DragSource(MosaicDragType.WINDOW, dragSource, (connect, monitor): DragSourceProps => ({
    connectDragSource: connect.dragSource(),
    connectDragPreview: connect.dragPreview()
})) as ClassDecorator)
@(DropTarget(MosaicDragType.WINDOW, dropTarget, (connect, monitor): DropTargetProps => ({
    connectDropTarget: connect.dropTarget(),
    isOver: monitor.isOver()
})) as ClassDecorator)
@PureRenderDecorator
class MosaicWindowComponentClass<T> extends React.Component<Props<T>, State> {
    static defaultProps = {
        additionalControlButtonText: 'More',
        draggable: true
    } as any;
    state: State = {
        additionalControlsOpen: false
    };
    context: MosaicTileContext<T>;

    static contextTypes = MosaicTileContext;

    static childContextTypes = {
        mosaicWindowActions: MosaicWindowActionsPropType
    };

    getChildContext(): Partial<MosaicWindowContext<T>> {
        return {
            mosaicWindowActions: {
                split: this.split,
                replaceWithNew: this.swap
            }
        }
    }

    private rootElement: HTMLElement;

    render() {
        const { className, isOver, title, additionalControls, connectDropTarget, connectDragPreview } = this.props;

        return connectDropTarget(div({
                className: classNames('mosaic-window mosaic-drop-target', className, {
                    'drop-target-hover': isOver,
                    'additional-controls-open': this.state.additionalControlsOpen
                }),
                ref: (element) => this.rootElement = element
            },
            this.renderToolbar(),
            div({ className: 'mosaic-window-body' },
                this.props.children!
            ),
            div({
                className: 'mosaic-window-body-overlay',
                onClick: () => this.setState({ additionalControlsOpen: false })
            }),
            div({ className: 'mosaic-window-additional-actions-bar' },
                additionalControls
            ),
            connectDragPreview(
                div({ className: 'mosaic-preview' },
                    div({ className: 'mosaic-window-toolbar' },
                        div({ className: 'mosaic-window-title' }, title)),
                    div({ className: 'mosaic-window-body' },
                        h4({}, title),
                        span({ className: 'pt-icon pt-icon-application' })
                    )
                )
            ),
            div({ className: 'drop-target-container' },
                _.values<string>(MosaicDropTargetPosition).map(this.renderDropTarget)
            )
        ));
    }

    private getToolbarControls() {
        const { toolbarControls, createNode } = this.props;
        if (toolbarControls) {
            return toolbarControls;
        } else if (createNode) {
            return DEFAULT_CONTROLS_WITH_CREATION;
        } else {
            return DEFAULT_CONTROLS_WITHOUT_CREATION;
        }
    }

    private renderToolbar() {
        const {
            title, draggable, additionalControls, additionalControlButtonText,
            connectDragSource
        } = this.props;
        const { additionalControlsOpen } = this.state;
        const toolbarControls = this.getToolbarControls();

        let titleDiv: React.ReactElement<any> =
            div({
                title,
                className: 'mosaic-window-title'
            }, title);

        const draggableAndNotRoot = draggable && this.context.getMosaicPath().length > 0;
        if (draggableAndNotRoot) {
            titleDiv = connectDragSource(titleDiv) as React.ReactElement<any>;
        }

        const hasAdditionalControls = !_.isEmpty(additionalControls);

        return div({
                className: classNames('mosaic-window-toolbar', { draggable: draggableAndNotRoot })
            },
            titleDiv,
            div({ className: 'mosaic-window-controls pt-button-group' },
                hasAdditionalControls && button({
                        onClick: () => this.setState({ additionalControlsOpen: !additionalControlsOpen }),
                        className: classNames('pt-button pt-minimal pt-icon-more', {
                            'pt-active': additionalControlsOpen
                        })
                    },
                    span({ className: 'control-text' }, additionalControlButtonText!)
                ),
                hasAdditionalControls && SeparatorFactory(),
                toolbarControls
            ));
    }

    private renderDropTarget = (position: MosaicDropTargetPosition) => {
        const path = this.context.getMosaicPath();

        return MosaicWindowDropTarget({
            position, path,
            key: position
        })
    };

    private checkCreateNode() {
        if (this.props.createNode == null) {
            throw new Error('Operation invalid unless `createNode` is defined');
        }
    }

    private split = () => {
        this.checkCreateNode();
        const { createNode } = this.props;
        const { mosaicActions, getMosaicPath } = this.context;
        const root = mosaicActions.getRoot();
        const path = getMosaicPath();

        const direction: MosaicDirection =
            this.rootElement.offsetWidth > this.rootElement.offsetHeight ? 'row' : 'column';

        return Promise.resolve(createNode!())
            .then((second) =>
                mosaicActions.replaceWith(path, {
                    direction, second,
                    first: getAndAssertNodeAtPathExists(root, path)
                }))
    };

    private swap = () => {
        this.checkCreateNode();
        const { mosaicActions, getMosaicPath } = this.context;
        const { createNode } = this.props;
        return Promise.resolve(createNode!())
            .then((node) =>
                mosaicActions.replaceWith(getMosaicPath(), node))
    };
}
export const MosaicWindow: React.ComponentClass<MosaicWindowProps<any>> = MosaicWindowComponentClass;

// Factory that works with generics
export function MosaicWindowFactory<T>(props: MosaicWindowProps<T> & React.Attributes, ...children: React.ReactNode[]) {
    const element: React.ReactElement<MosaicWindowProps<T>> = React.createElement(
        MosaicWindowComponentClass as React.ComponentClass<MosaicWindowProps<T>>, props, ...children);
    return element;
}
