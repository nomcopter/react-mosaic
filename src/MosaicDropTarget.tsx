import classNames from 'classnames';
import React from 'react';
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
  static contextType = MosaicContext;
  context!: MosaicContext<any>;

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

export const MosaicDropTarget = (DropTarget(
  MosaicDragType.WINDOW,
  dropTarget,
  (connect, monitor): DropTargetProps => ({
    connectDropTarget: connect.dropTarget(),
    isOver: monitor.isOver(),
    draggedMosaicId: ((monitor.getItem() || {}) as MosaicDragItem).mosaicId,
  }),
)(MosaicDropTargetClass) as any) as React.ComponentType<MosaicDropTargetProps>;
