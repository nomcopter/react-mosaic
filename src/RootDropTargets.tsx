import classNames from 'classnames';
import values from 'lodash/values';
import React from 'react';
import { DropTarget } from 'react-dnd';

import { MosaicDropTargetPosition } from './internalTypes';
import { MosaicDropTarget } from './MosaicDropTarget';
import { MosaicDragType } from './types';

export interface RootDropTargetsProps {
  isDragging: boolean;
}

const RootDropTargetsComponent = React.memo((props: RootDropTargetsProps) => {
  const delayedIsDragging = useDelayedTrue(props.isDragging, 0);
  return (
    <div
      className={classNames('drop-target-container', {
        '-dragging': delayedIsDragging,
      })}
    >
      {values<MosaicDropTargetPosition>(MosaicDropTargetPosition).map((position) => (
        <MosaicDropTarget position={position} path={[]} key={position} />
      ))}
    </div>
  );
});
RootDropTargetsComponent.displayName = 'RootDropTargetsComponent';

function useDelayedTrue(currentValue: boolean, delay: number): boolean {
  const delayedRef = React.useRef(currentValue);

  const [, setCounter] = React.useState(0);
  const setAndRender = (newValue: boolean) => {
    delayedRef.current = newValue;
    setCounter((count) => count + 1);
  };

  React.useEffect(() => {
    if (delayedRef.current === currentValue) {
      return;
    }

    let timer: number | undefined;
    if (currentValue) {
      timer = window.setTimeout(() => setAndRender(true), delay);
    } else {
      setAndRender(false);
    }
    return () => {
      if (timer) {
        window.clearTimeout(timer);
      }
    };
  }, [currentValue]);

  return delayedRef.current;
}

const dropTarget = {};
export const RootDropTargets = DropTarget(
  MosaicDragType.WINDOW,
  dropTarget,
  (_connect, monitor): RootDropTargetsProps => ({
    isDragging: monitor.getItem() !== null && monitor.getItemType() === MosaicDragType.WINDOW,
  }),
)(RootDropTargetsComponent as any) as React.ComponentType;
