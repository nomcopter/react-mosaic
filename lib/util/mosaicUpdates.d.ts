import { MosaicDropTargetPosition } from '../internalTypes';
import { MosaicKey, MosaicNode, MosaicParent, MosaicPath, MosaicUpdate, MosaicUpdateSpec } from '../types';
export { MosaicParent };
/**
 * Used to prepare `update` for `immutability-helper`
 * @param mosaicUpdate
 * @returns {any}
 */
export declare function buildSpecFromUpdate<T extends MosaicKey>(mosaicUpdate: MosaicUpdate<T>): MosaicUpdateSpec<T>;
/**
 * Applies `updates` to `root`
 * @param root
 * @param updates
 * @returns {MosaicNode<T>}
 */
export declare function updateTree<T extends MosaicKey>(root: MosaicNode<T>, updates: MosaicUpdate<T>[]): MosaicNode<T>;
/**
 * Creates a `MosaicUpdate<T>` to remove the node at `path` from `root`
 * @param root
 * @param path
 * @returns {{path: T[], spec: {$set: MosaicNode<T>}}}
 */
export declare function createRemoveUpdate<T extends MosaicKey>(root: MosaicNode<T> | null, path: MosaicPath): MosaicUpdate<T>;
/**
 * Creates a `MosaicUpdate<T>` to split the _leaf_ at `destinationPath` into a node of it and the node from `sourcePath`
 * placing the node from `sourcePath` in `position`.
 * @param root
 * @param sourcePath
 * @param destinationPath
 * @param position
 * @returns {(MosaicUpdate<T>|{path: MosaicPath, spec: {$set: {first: MosaicNode<T>, second: MosaicNode<T>, direction: MosaicDirection}}})[]}
 */
export declare function createDragToUpdates<T extends MosaicKey>(root: MosaicNode<T>, sourcePath: MosaicPath, destinationPath: MosaicPath, position: MosaicDropTargetPosition): MosaicUpdate<T>[];
/**
 * Sets the splitPercentage to hide the node at `path`
 * @param path
 * @returns {{path: T[], spec: {splitPercentage: {$set: number}}}}
 */
export declare function createHideUpdate<T extends MosaicKey>(path: MosaicPath): MosaicUpdate<T>;
/**
 * Sets the splitPercentage of node at `path` and all of its parents to `percentage` in order to expand it
 * @param path
 * @param percentage
 * @returns {{spec: MosaicUpdateSpec<T>, path: Array}}
 */
export declare function createExpandUpdate<T extends MosaicKey>(path: MosaicPath, percentage: number): MosaicUpdate<T>;
