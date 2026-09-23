import { MosaicPath } from './types';

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
 * Drop result returned by mosaic drop targets, read via `monitor.getDropResult()`.
 * Window and root edges return `path` + `position`; tab bars return `path`
 * and optionally `tabReorderIndex`.
 */
export interface MosaicDropData {
  path?: MosaicPath;
  position?: MosaicDropTargetPosition;
  tabReorderIndex?: number; // For tab reordering within the same container
}

/**
 * Item carried by a `MosaicDragType.WINDOW` drag. External drag sources must
 * set `mosaicId` to the target Mosaic's id for its drop zones to highlight.
 */
export interface MosaicDragItem {
  mosaicId: string;
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