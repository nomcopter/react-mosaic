import React from 'react';
import classNames from 'classnames';
import { useDrop, DropTargetMonitor } from 'react-dnd';
import { MosaicDragType, MosaicPath } from './types';
import { MosaicDropData, MosaicDropTargetPosition } from './internalTypes';
import { MosaicContext } from './contextTypes';

export interface MosaicDropTargetProps {
  path: MosaicPath;
  /** An edge splits the window at `path`; `'swap'` trades places with it */
  position: MosaicDropTargetPosition | 'swap';
  /** Only for `'swap'`: cover the whole window instead of just its centre */
  fill?: boolean;
}

export const MosaicDropTarget = ({
  path,
  position,
  fill = false,
}: MosaicDropTargetProps) => {
  const { mosaicId } = React.useContext(MosaicContext);
  const [{ isOver, draggedMosaicId }, connectDropTarget] = useDrop({
    accept: MosaicDragType.WINDOW,
    drop: (): MosaicDropData =>
      position === 'swap' ? { path, swap: true } : { path, position },
    collect: (monitor: DropTargetMonitor<{ mosaicId: string }>) => ({
      isOver: monitor.isOver(),
      draggedMosaicId: monitor.getItem()?.mosaicId,
    }),
  });

  return connectDropTarget(
    <div
      className={classNames('drop-target', position, {
        '-fill': fill,
        'drop-target-hover': isOver && draggedMosaicId === mosaicId,
      })}
    />,
  );
};