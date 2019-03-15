import clone from 'lodash/clone';
import get from 'lodash/get';
import { MosaicBranch, MosaicDirection, MosaicKey, MosaicNode, MosaicParent, MosaicPath } from '../types';

function alternateDirection<T extends MosaicKey>(
  node: MosaicNode<T>,
  direction: MosaicDirection = 'row',
): MosaicNode<T> {
  if (isParent(node)) {
    const nextDirection = getOtherDirection(direction);
    return {
      direction,
      first: alternateDirection(node.first, nextDirection),
      second: alternateDirection(node.second, nextDirection),
    };
  } else {
    return node;
  }
}

export enum Corner {
  TOP_LEFT = 1,
  TOP_RIGHT,
  BOTTOM_LEFT,
  BOTTOM_RIGHT,
}

/**
 * Returns `true` if `node` is a MosaicParent
 * @param node
 * @returns {boolean}
 */
export function isParent<T extends MosaicKey>(node: MosaicNode<T>): node is MosaicParent<T> {
  return (node as MosaicParent<T>).direction != null;
}

/**
 * Creates a balanced binary tree from `leaves` with the goal of making them as equal area as possible
 * @param leaves
 * @param startDirection
 * @returns {MosaicNode<T>}
 */
export function createBalancedTreeFromLeaves<T extends MosaicKey>(
  leaves: MosaicNode<T>[],
  startDirection: MosaicDirection = 'row',
): MosaicNode<T> | null {
  if (leaves.length === 0) {
    return null;
  }

  let current: MosaicNode<T>[] = clone(leaves);
  let next: MosaicNode<T>[] = [];

  while (current.length > 1) {
    while (current.length > 0) {
      if (current.length > 1) {
        next.push({
          direction: 'row',
          first: current.shift()!,
          second: current.shift()!,
        });
      } else {
        next.unshift(current.shift()!);
      }
    }
    current = next;
    next = [];
  }
  return alternateDirection(current[0], startDirection);
}

/**
 * Gets the sibling of `branch`
 * @param branch
 * @returns {any}
 */
export function getOtherBranch(branch: MosaicBranch): MosaicBranch {
  if (branch === 'first') {
    return 'second';
  } else if (branch === 'second') {
    return 'first';
  } else {
    throw new Error(`Branch '${branch}' not a valid branch`);
  }
}

/**
 * Gets the opposite of `direction`
 * @param direction
 * @returns {any}
 */
export function getOtherDirection(direction: MosaicDirection): MosaicDirection {
  if (direction === 'row') {
    return 'column';
  } else {
    return 'row';
  }
}

/**
 * Traverses `tree` to find the path to the specified `corner`
 * @param tree
 * @param corner
 * @returns {MosaicPath}
 */
export function getPathToCorner(tree: MosaicNode<any>, corner: Corner): MosaicPath {
  let currentNode: MosaicNode<any> = tree;
  const currentPath: MosaicPath = [];
  while (isParent(currentNode)) {
    if (currentNode.direction === 'row' && (corner === Corner.TOP_LEFT || corner === Corner.BOTTOM_LEFT)) {
      currentPath.push('first');
      currentNode = currentNode.first;
    } else if (currentNode.direction === 'column' && (corner === Corner.TOP_LEFT || corner === Corner.TOP_RIGHT)) {
      currentPath.push('first');
      currentNode = currentNode.first;
    } else {
      currentPath.push('second');
      currentNode = currentNode.second;
    }
  }

  return currentPath;
}

/**
 * Gets all leaves of `tree`
 * @param tree
 * @returns {T[]}
 */
export function getLeaves<T extends MosaicKey>(tree: MosaicNode<T> | null): T[] {
  if (tree == null) {
    return [];
  } else if (isParent(tree)) {
    return getLeaves(tree.first).concat(getLeaves(tree.second));
  } else {
    return [tree];
  }
}

/**
 * Gets node at `path` from `tree`
 * @param tree
 * @param path
 * @returns {MosaicNode<T>|null}
 */
export function getNodeAtPath<T extends MosaicKey>(tree: MosaicNode<T> | null, path: MosaicPath): MosaicNode<T> | null {
  if (path.length > 0) {
    return get(tree, path, null);
  } else {
    return tree;
  }
}

/**
 * Gets node at `path` from `tree` and verifies that neither `tree` nor the result are null
 * @param tree
 * @param path
 * @returns {MosaicNode<T>}
 */
export function getAndAssertNodeAtPathExists<T extends MosaicKey>(
  tree: MosaicNode<T> | null,
  path: MosaicPath,
): MosaicNode<T> {
  if (tree == null) {
    throw new Error('Root is empty, cannot fetch path');
  }
  const node = getNodeAtPath(tree, path);
  if (node == null) {
    throw new Error(`Path [${path.join(', ')}] did not resolve to a node`);
  }
  return node;
}
