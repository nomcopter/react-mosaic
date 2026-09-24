import React, { useContext, useEffect, useState } from 'react';
import { DndContext, useDragLayer } from 'react-dnd';

import { MosaicDragItem } from './internalTypes';
import { MosaicDragType } from './types';
import { getDragPreview } from './util/dragPreviewRegistry';

// The parts of react-dnd-multi-backend's MultiBackend used here. A consumer's
// own DndProvider may use a different backend, so every call is feature-checked.
interface PreviewAwareBackend {
  previewEnabled(): boolean;
  previewsList(): {
    register(observer: PreviewObserver): void;
    unregister(observer: PreviewObserver): void;
  };
}

interface PreviewObserver {
  backendChanged(backend: PreviewAwareBackend): void;
}

function isPreviewAwareBackend(
  backend: unknown,
): backend is PreviewAwareBackend {
  const candidate = backend as Partial<PreviewAwareBackend> | null | undefined;
  return (
    typeof candidate?.previewEnabled === 'function' &&
    typeof candidate?.previewsList === 'function'
  );
}

/**
 * True while the active drag and drop backend asks for a custom preview. With
 * Mosaic's multi-backend that's the touch backend, which (unlike HTML5 drag
 * and drop) has no native drag image.
 */
function useBackendWantsPreview(): boolean {
  const { dragDropManager } = useContext(DndContext);
  const backend: unknown = dragDropManager?.getBackend();
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (!isPreviewAwareBackend(backend)) {
      setEnabled(false);
      return;
    }
    const observer: PreviewObserver = {
      backendChanged: (changed) => setEnabled(changed.previewEnabled()),
    };
    setEnabled(backend.previewEnabled());
    backend.previewsList().register(observer);
    return () => backend.previewsList().unregister(observer);
  }, [backend]);

  return enabled;
}

/**
 * Shows what is being dragged under the finger during touch drags. Renders
 * nothing for mouse drags, which keep the browser's native drag image.
 */
export function TouchDragPreview({ mosaicId }: { mosaicId: string }) {
  return useBackendWantsPreview() ? (
    <TouchDragPreviewLayer mosaicId={mosaicId} />
  ) : null;
}

// Width and height of the preview box, see .mosaic-touch-drag-preview
const PREVIEW_WIDTH = 200;
// The finger sits this far below the top edge, on the preview's title bar
const FINGER_OFFSET_Y = 15;

function TouchDragPreviewLayer({ mosaicId }: { mosaicId: string }) {
  const { item, offset } = useDragLayer((monitor) => ({
    item:
      monitor.isDragging() && monitor.getItemType() === MosaicDragType.WINDOW
        ? (monitor.getItem() as MosaicDragItem | null)
        : null,
    offset: monitor.getClientOffset(),
  }));

  // Several mosaics share one drag and drop manager; only the source's shows it
  if (item == null || item.mosaicId !== mosaicId || offset == null) {
    return null;
  }
  const render = getDragPreview(item);
  if (render === undefined) {
    return null;
  }

  const transform = `translate(${offset.x - PREVIEW_WIDTH / 2}px, ${
    offset.y - FINGER_OFFSET_Y
  }px)`;
  return (
    <div
      className={
        item.isTab
          ? 'mosaic-touch-drag-preview -tab'
          : 'mosaic-touch-drag-preview'
      }
      style={{ transform, WebkitTransform: transform }}
    >
      {render()}
    </div>
  );
}
