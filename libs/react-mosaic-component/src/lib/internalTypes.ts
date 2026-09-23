import { MosaicKey, MosaicPath } from './types';

/**
 * Edge of a window (or of the root) that a dragged window can be dropped on.
 */
export type MosaicDropTargetPosition =
  | 'top'
  | 'bottom'
  | 'left'
  | 'right';
export const MosaicDropTargetPosition = {
  TOP: 'top' as const,
  BOTTOM: 'bottom' as const,
  LEFT: 'left' as const,
  RIGHT: 'right' as const,
};

/**
 * Drop result read by mosaic drag sources via `monitor.getDropResult()`.
 * Mosaic's own targets return `path` (+ `position` or `tabReorderIndex`).
 * A drop target outside the layout can return `{ remove: true }` to take the
 * dragged window or tab out of the layout instead of cancelling the drag.
 */
export interface MosaicDropData {
  path?: MosaicPath;
  position?: MosaicDropTargetPosition;
  tabReorderIndex?: number; // For tab reordering within the same container
  remove?: boolean;
}

/**
 * Item carried by a `MosaicDragType.WINDOW` drag. External drag sources only
 * need `mosaicId` (the target Mosaic's id, for its drop zones to highlight).
 */
export interface MosaicDragItem {
  mosaicId: string;
  /** Path of the dragged window or tab when the drag started */
  path?: MosaicPath;
  /** Key of the dragged panel */
  nodeKey?: MosaicKey;
  isTab?: boolean;
  tabIndex?: number;
  tabKey?: string | number;
  tabContainerPath?: MosaicPath;
  hideTimer?: number;
}

/**
 * Describes where a node is dropped; the last argument of `createDragToUpdates`.
 */
export type DropInfo =
  | { type: 'split', position: MosaicDropTargetPosition }
  | { type: 'tab-container' }
  | { type: 'tab-reorder', insertIndex: number };