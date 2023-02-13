import classNames from 'classnames';
import values from 'lodash/values';
import React from 'react';
import { useDrop } from 'react-dnd';

import { MosaicDropTargetPosition } from './internalTypes';
import { MosaicDropTarget } from './MosaicDropTarget';
import { MosaicDragType } from './types';

export const RootDropTargets = React.memo(() => {
  const [{ isDragging }] = useDrop({
    accept: MosaicDragType.WINDOW,
    collect: (monitor) => ({
      isDragging: monitor.getItem() !== null && monitor.getItemType() === MosaicDragType.WINDOW,
    }),
  });
  const delayedIsDragging = useDelayedTrue(isDragging, 0);
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
RootDropTargets.displayName = 'RootDropTargets';

function useDelayedTrue(currentValue: boolean, delay: number): boolean {
  const delayedRef = React.useRef(currentValue);

  const [, setCounter] = React.useState(0);
  const setAndRender = (newValue: boolean) => {
    delayedRef.current = newValue;
    setCounter((count) => count + 1);
  };

  if (!currentValue) {
    delayedRef.current = false;
  }

  React.useEffect(() => {
    if (delayedRef.current === currentValue || !currentValue) {
      return;
    }

    const timer = window.setTimeout(() => setAndRender(true), delay);
    return () => {
      window.clearTimeout(timer);
    };
  }, [currentValue]);

  return delayedRef.current;
}
