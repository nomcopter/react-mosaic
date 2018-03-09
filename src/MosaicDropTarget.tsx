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
import { ConnectDropTarget, DropTarget, DropTargetMonitor } from 'react-dnd';
import { MosaicContext } from './contextTypes';
import { MosaicDragItem, MosaicDropData, MosaicDropTargetPosition } from './internalTypes';
import { MosaicDragType, MosaicPath } from './types';

export interface MosaicDropTargetProps {
  position: MosaicDropTargetPosition;
  path: MosaicPath;
}

interface DropTargetProps {
  connectDropTarget: ConnectDropTarget;
  isOver: boolean;
  draggedMosaicId: string | undefined;
}

type Props = MosaicDropTargetProps & DropTargetProps;

const dropTarget = {
  drop: (props: Props, monitor: DropTargetMonitor, component: MosaicDropTargetClass): MosaicDropData => {
    if (component.context.mosaicId === ((monitor.getItem() || {}) as MosaicDragItem).mosaicId) {
      return {
        path: props.path,
        position: props.position,
      };
    } else {
      return {};
    }
  },
};

class MosaicDropTargetClass extends React.PureComponent<Props> {
  static contextTypes = MosaicContext;
  context: MosaicContext<any>;

  render() {
    const { position, isOver, connectDropTarget, draggedMosaicId } = this.props;
    return connectDropTarget(
      <div
        className={classNames('drop-target', position, {
          'drop-target-hover': isOver && draggedMosaicId === this.context.mosaicId,
        })}
      />,
    );
  }
}

export const MosaicDropTarget = DropTarget(MosaicDragType.WINDOW, dropTarget, (connect, monitor): DropTargetProps => ({
  connectDropTarget: connect.dropTarget(),
  isOver: monitor.isOver(),
  draggedMosaicId: ((monitor.getItem() || {}) as MosaicDragItem).mosaicId,
}))(MosaicDropTargetClass) as React.ComponentClass<MosaicDropTargetProps>;
