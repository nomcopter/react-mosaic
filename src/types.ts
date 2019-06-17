import { Spec } from 'immutability-helper';

/**
 * Valid node types
 * @see React.Key
 */
export type MosaicKey = string | number;

/**
 * Base type for the Mosaic binary tree
 */
export type MosaicNode<T extends MosaicKey> = MosaicParent<T> | T;

/**
 * Row means each window is side-by-side
 */
export type MosaicDirection = 'row' | 'column';

export interface MosaicParent<T extends MosaicKey> {
  direction: MosaicDirection;
  first: MosaicNode<T>;
  second: MosaicNode<T>;
  splitPercentage?: number;
}

export type MosaicBranch = 'first' | 'second';
export type MosaicPath = MosaicBranch[];

/**
 * Used by many utility methods to update the tree.
 * spec will be passed to https://github.com/kolodny/immutability-helper
 */
export type MosaicUpdateSpec<T extends MosaicKey> = Spec<MosaicNode<T>>;

export interface MosaicUpdate<T extends MosaicKey> {
  path: MosaicPath;
  spec: MosaicUpdateSpec<T>;
}

/**
 * Mosaic needs a way to resolve `MosaicKey` into react elements for display.
 * This provides a way to render them.
 */
export type TileRenderer<T extends MosaicKey> = (t: T, path: MosaicBranch[]) => JSX.Element;

/**
 * Function that provides a new node to put into the tree
 */
export type CreateNode<T extends MosaicKey> = (...args: any[]) => Promise<MosaicNode<T>> | MosaicNode<T>;

/**
 * Used by `react-dnd`
 * @type {{WINDOW: string}}
 */
export const MosaicDragType = {
  WINDOW: 'MosaicWindow',
};

export interface EnabledResizeOptions {
  minimumPaneSizePercentage?: number; // Default: 20
}

export type ResizeOptions = 'DISABLED' | EnabledResizeOptions;
