import * as classNames from 'classnames';
import * as _ from 'lodash';
import * as React from 'react';
import { DropTarget } from 'react-dnd';
import { MosaicDropTargetPosition } from './internalTypes';
import { MosaicDropTarget } from './MosaicDropTarget';
import { MosaicDragType } from './types';

export interface RootDropTargetsProps {
  isDragging: boolean;
}

class RootDropTargetsClass extends React.PureComponent<RootDropTargetsProps> {
  render() {
    return (
      <div
        className={classNames('drop-target-container', {
          '-dragging': this.props.isDragging,
        })}
      >
        {_.values<MosaicDropTargetPosition>(MosaicDropTargetPosition).map((position) => (
          <MosaicDropTarget position={position} path={[]} key={position} />
        ))}
      </div>
    );
  }
}

const dropTarget = {};
export const RootDropTargets = DropTarget(
  MosaicDragType.WINDOW,
  dropTarget,
  (_connect, monitor): RootDropTargetsProps => ({
    isDragging: monitor.getItem() !== null && monitor.getItemType() === MosaicDragType.WINDOW,
  }),
)(RootDropTargetsClass) as React.ComponentClass<{}>;
