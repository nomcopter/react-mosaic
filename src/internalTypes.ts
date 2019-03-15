import { MosaicPath } from './types';

export type MosaicDropTargetPosition = 'top' | 'bottom' | 'left' | 'right';
export const MosaicDropTargetPosition = {
  TOP: 'top' as 'top',
  BOTTOM: 'bottom' as 'bottom',
  LEFT: 'left' as 'left',
  RIGHT: 'right' as 'right',
};

export interface MosaicDropData {
  path?: MosaicPath;
  position?: MosaicDropTargetPosition;
}

export interface MosaicDragItem {
  mosaicId: string;
  hideTimer: number;
}
