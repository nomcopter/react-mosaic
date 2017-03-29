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
import * as PureRenderDecorator from 'pure-render-decorator';
import * as React from 'react';
import { ConnectDropTarget, DropTarget } from 'react-dnd';
import { MosaicDragType, MosaicDropData, MosaicDropTargetPosition, MosaicPath } from './types';
import DropTargetMonitor = __ReactDnd.DropTargetMonitor;

const { div } = React.DOM;

export interface MosaicWindowDropTargetProps {
    position: MosaicDropTargetPosition;
    path: MosaicPath;
}

interface DropTargetProps {
    connectDropTarget: ConnectDropTarget;
    isOver: boolean;
}

type Props = MosaicWindowDropTargetProps & DropTargetProps;

const dropTarget = {
    drop: (props: Props, _monitor: DropTargetMonitor): MosaicDropData => ({
        path: props.path,
        position: props.position,
    }),
};

@(DropTarget(MosaicDragType.WINDOW, dropTarget, (connect, monitor): DropTargetProps => ({
    connectDropTarget: connect.dropTarget(),
    isOver: monitor.isOver(),
})) as ClassDecorator)
@PureRenderDecorator
class MosaicWindowDropTargetClass extends React.Component<Props, void> {
    render() {
        const { position, isOver, connectDropTarget } = this.props;
        return connectDropTarget(div({
            className: classNames('drop-target', position, {
                'drop-target-hover': isOver,
            }),
        }));
    }
}

export const MosaicWindowDropTarget = React.createFactory(
    MosaicWindowDropTargetClass as React.ComponentClass<MosaicWindowDropTargetProps>);
