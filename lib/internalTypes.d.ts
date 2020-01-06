import { MosaicPath } from './types';
export declare type MosaicDropTargetPosition = 'top' | 'bottom' | 'left' | 'right';
export declare const MosaicDropTargetPosition: {
    TOP: "top";
    BOTTOM: "bottom";
    LEFT: "left";
    RIGHT: "right";
};
export interface MosaicDropData {
    path?: MosaicPath;
    position?: MosaicDropTargetPosition;
}
export interface MosaicDragItem {
    mosaicId: string;
    hideTimer: number;
}
