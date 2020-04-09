import { MosaicBranch, MosaicDirection, MosaicKey, MosaicNode, MosaicParent, MosaicPath } from '../types';
export declare enum Corner {
    TOP_LEFT = 1,
    TOP_RIGHT = 2,
    BOTTOM_LEFT = 3,
    BOTTOM_RIGHT = 4
}
/**
 * Returns `true` if `node` is a MosaicParent
 * @param node
 * @returns {boolean}
 */
export declare function isParent<T extends MosaicKey>(node: MosaicNode<T>): node is MosaicParent<T>;
/**
 * Creates a balanced binary tree from `leaves` with the goal of making them as equal area as possible
 * @param leaves
 * @param startDirection
 * @returns {MosaicNode<T>}
 */
export declare function createBalancedTreeFromLeaves<T extends MosaicKey>(leaves: MosaicNode<T>[], startDirection?: MosaicDirection): MosaicNode<T> | null;
/**
 * Gets the sibling of `branch`
 * @param branch
 * @returns {any}
 */
export declare function getOtherBranch(branch: MosaicBranch): MosaicBranch;
/**
 * Gets the opposite of `direction`
 * @param direction
 * @returns {any}
 */
export declare function getOtherDirection(direction: MosaicDirection): MosaicDirection;
/**
 * Traverses `tree` to find the path to the specified `corner`
 * @param tree
 * @param corner
 * @returns {MosaicPath}
 */
export declare function getPathToCorner(tree: MosaicNode<any>, corner: Corner): MosaicPath;
/**
 * Gets all leaves of `tree`
 * @param tree
 * @returns {T[]}
 */
export declare function getLeaves<T extends MosaicKey>(tree: MosaicNode<T> | null): T[];
/**
 * Gets node at `path` from `tree`
 * @param tree
 * @param path
 * @returns {MosaicNode<T>|null}
 */
export declare function getNodeAtPath<T extends MosaicKey>(tree: MosaicNode<T> | null, path: MosaicPath): MosaicNode<T> | null;
/**
 * Gets node at `path` from `tree` and verifies that neither `tree` nor the result are null
 * @param tree
 * @param path
 * @returns {MosaicNode<T>}
 */
export declare function getAndAssertNodeAtPathExists<T extends MosaicKey>(tree: MosaicNode<T> | null, path: MosaicPath): MosaicNode<T>;
