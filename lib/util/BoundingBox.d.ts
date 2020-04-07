import { MosaicDirection } from '../types';
export interface BoundingBox {
    top: number;
    right: number;
    bottom: number;
    left: number;
}
export declare namespace BoundingBox {
    function empty(): {
        top: number;
        right: number;
        bottom: number;
        left: number;
    };
    interface Split {
        first: BoundingBox;
        second: BoundingBox;
    }
    interface Styles {
        top: string;
        right: string;
        bottom: string;
        left: string;
    }
    function split(boundingBox: BoundingBox, relativeSplitPercentage: number, direction: MosaicDirection): Split;
    function getAbsoluteSplitPercentage(boundingBox: BoundingBox, relativeSplitPercentage: number, direction: MosaicDirection): number;
    function getRelativeSplitPercentage(boundingBox: BoundingBox, absoluteSplitPercentage: number, direction: MosaicDirection): number;
    function asStyles({ top, right, bottom, left }: BoundingBox): Styles;
}
