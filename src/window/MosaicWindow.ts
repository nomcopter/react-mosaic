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
import { ConnectDragPreview, ConnectDragSource, ConnectDropTarget, DragSource, DropTarget } from 'react-dnd';
import { MosaicTileContext, MosaicWindowActionsPropType, MosaicWindowContext } from '../contextTypes';
import { MosaicWindowDropTarget } from '../MosaicDropTarget';
import { createDragToUpdates } from '../mosaicUpdates';
import { getAndAssertNodeAtPathExists } from '../mosaicUtilities';
import { CreateNode, MosaicDirection, MosaicDragType } from '../types';
import {
    DEFAULT_CONTROLS_WITH_CREATION,
    DEFAULT_CONTROLS_WITHOUT_CREATION,
    SeparatorFactory,
} from './defaultToolbarControls';
import DragSourceMonitor = __ReactDnd.DragSourceMonitor;
import { MosaicDragItem, MosaicDropData, MosaicDropTargetPosition } from '../internalTypes';

const { div, span, button, h4 } = React.DOM;

export interface MosaicWindowProps<T> {
    title: string;
    className?: string;
    toolbarControls?: React.ReactElement<any>[];
    additionalControls?: React.ReactElement<any>[];
    additionalControlButtonText?: string;
    draggable?: boolean;
    createNode?: CreateNode<T>;
    renderPreview?: (props: MosaicWindowProps<T>) => JSX.Element;
}

interface DragSourceProps {
    connectDragSource: ConnectDragSource;
    connectDragPreview: ConnectDragPreview;
}

interface DropTargetProps {
    connectDropTarget: ConnectDropTarget;
    isOver: boolean;
    draggedMosaicId: string | undefined;
}

type Props<T> = MosaicWindowProps<T> & DropTargetProps & DragSourceProps;

interface State {
    additionalControlsOpen: boolean;
}

const dragSource = {
    beginDrag: (_props: Props<any>, _monitor: DragSourceMonitor, { context }: MosaicWindowClass<any>): MosaicDragItem => {
        // The defer is necessary as the element must be present on start for HTML DnD to not cry
        _.defer(() => context.mosaicActions.hide(context.getMosaicPath()));
        return {
            mosaicId: context.mosaicId,
        };
    },
    endDrag: (_props: Props<any>, monitor: DragSourceMonitor, { context }: MosaicWindowClass<any>) => {
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
                        $set: null,
                    },
                },
            }]);
        }
    },
};

const dropTarget = { };

@(DropTarget(MosaicDragType.WINDOW, dropTarget, (connect, monitor): DropTargetProps => ({
    connectDropTarget: connect.dropTarget(),
    isOver: monitor.isOver(),
    draggedMosaicId: ((monitor.getItem() || {}) as MosaicDragItem).mosaicId,
})) as ClassDecorator)
@(DragSource(MosaicDragType.WINDOW, dragSource, (connect, _monitor): DragSourceProps => ({
    connectDragSource: connect.dragSource(),
    connectDragPreview: connect.dragPreview(),
})) as ClassDecorator)
class MosaicWindowClass<T> extends React.PureComponent<Props<T>, State> {
    static defaultProps: Partial<Props<any>> = {
        additionalControlButtonText: 'More',
        draggable: true,
        renderPreview: ({ title }) =>
            div({ className: 'mosaic-preview' },
                div({ className: 'mosaic-window-toolbar' },
                    div({ className: 'mosaic-window-title' }, title)),
                div({ className: 'mosaic-window-body' },
                    h4({}, title),
                    span({ className: 'pt-icon pt-icon-application' }),
                ),
            ),
    };

    static contextTypes = MosaicTileContext;

    static childContextTypes = {
        mosaicWindowActions: MosaicWindowActionsPropType,
    };

    state: State = {
        additionalControlsOpen: false,
    };
    context: MosaicTileContext<T>;

    private rootElement: HTMLElement | null;

    getChildContext(): Partial<MosaicWindowContext<T>> {
        return {
            mosaicWindowActions: {
                split: this.split,
                replaceWithNew: this.swap,
            },
        };
    }

    render() {
        const { className, isOver, renderPreview, additionalControls, connectDropTarget, connectDragPreview, draggedMosaicId } = this.props;

        return connectDropTarget(div({
                className: classNames('mosaic-window mosaic-drop-target', className, {
                    'drop-target-hover': isOver && draggedMosaicId === this.context.mosaicId,
                    'additional-controls-open': this.state.additionalControlsOpen,
                }),
                ref: (element) => this.rootElement = element,
            },
            this.renderToolbar(),
            div({ className: 'mosaic-window-body' },
                this.props.children!,
            ),
            div({
                className: 'mosaic-window-body-overlay',
                onClick: () => this.setState({ additionalControlsOpen: false }),
            }),
            div({ className: 'mosaic-window-additional-actions-bar' },
                additionalControls,
            ),
            connectDragPreview(renderPreview!(this.props)),
            div({ className: 'drop-target-container' },
                _.values<string>(MosaicDropTargetPosition).map(this.renderDropTarget),
            ),
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
            connectDragSource,
        } = this.props;
        const { additionalControlsOpen } = this.state;
        const toolbarControls = this.getToolbarControls();

        let titleDiv: React.ReactElement<any> =
            div({
                title,
                className: 'mosaic-window-title',
            }, title);

        const draggableAndNotRoot = draggable && this.context.getMosaicPath().length > 0;
        if (draggableAndNotRoot) {
            titleDiv = connectDragSource(titleDiv) as React.ReactElement<any>;
        }

        const hasAdditionalControls = !_.isEmpty(additionalControls);

        return div({
                className: classNames('mosaic-window-toolbar', { draggable: draggableAndNotRoot }),
            },
            titleDiv,
            div({ className: 'mosaic-window-controls pt-button-group' },
                hasAdditionalControls && button({
                        onClick: () => this.setState({ additionalControlsOpen: !additionalControlsOpen }),
                        className: classNames('pt-button pt-minimal pt-icon-more', {
                            'pt-active': additionalControlsOpen,
                        }),
                    },
                    span({ className: 'control-text' }, additionalControlButtonText!),
                ),
                hasAdditionalControls && SeparatorFactory(),
                toolbarControls,
            ));
    }

    private renderDropTarget = (position: MosaicDropTargetPosition) => {
        const path = this.context.getMosaicPath();

        return MosaicWindowDropTarget({
            position, path,
            key: position,
        });
    };

    private checkCreateNode() {
        if (this.props.createNode == null) {
            throw new Error('Operation invalid unless `createNode` is defined');
        }
    }

    private split = (...args) => {
        this.checkCreateNode();
        const { createNode } = this.props;
        const { mosaicActions, getMosaicPath } = this.context;
        const root = mosaicActions.getRoot();
        const path = getMosaicPath();

        const direction: MosaicDirection =
            this.rootElement!.offsetWidth > this.rootElement!.offsetHeight ? 'row' : 'column';

        return Promise.resolve(createNode!(...args))
            .then((second) =>
                mosaicActions.replaceWith(path, {
                    direction, second,
                    first: getAndAssertNodeAtPathExists(root, path),
                }));
    };

    private swap = (...args) => {
        this.checkCreateNode();
        const { mosaicActions, getMosaicPath } = this.context;
        const { createNode } = this.props;
        return Promise.resolve(createNode!(...args))
            .then((node) =>
                mosaicActions.replaceWith(getMosaicPath(), node));
    };
}
export const MosaicWindow: React.ComponentClass<MosaicWindowProps<any>> = MosaicWindowClass;

// Factory that works with generics
export function MosaicWindowFactory<T>(props: MosaicWindowProps<T> & React.Attributes, ...children: React.ReactNode[]) {
    const element: React.ReactElement<MosaicWindowProps<T>> = React.createElement(
        MosaicWindowClass as React.ComponentClass<MosaicWindowProps<T>>, props, ...children);
    return element;
}
