import React from 'react';
import { MosaicDropTargetPosition } from './internalTypes';
import { MosaicPath } from './types';
export interface MosaicDropTargetProps {
    position: MosaicDropTargetPosition;
    path: MosaicPath;
}
export declare const MosaicDropTarget: React.ComponentType<MosaicDropTargetProps>;
