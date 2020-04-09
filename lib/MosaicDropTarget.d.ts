import React from 'react';
import { MosaicDropTargetPosition } from './internalTypes';
import { MosaicPath } from './types';
export interface MosaicDropTargetProps {
    position: MosaicDropTargetPosition;
    path: MosaicPath;
    tabId?: string;
}
export declare const MosaicDropTarget: React.ComponentType<MosaicDropTargetProps>;
