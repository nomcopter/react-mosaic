import { MosaicKey, MosaicNode, MosaicPath } from '../types';
import { getNodeAtPath, isSplitNode, isTabsNode } from './mosaicUtilities';

/**
 * Finds the path of the leaf `key`, whether it's a split child or a tab.
 * Returns null if the key isn't in the tree.
 */
export function findPathToLeaf<T extends MosaicKey>(
  tree: MosaicNode<T> | null,
  key: T,
): MosaicPath | null {
  if (tree == null) {
    return null;
  }
  if (isTabsNode(tree)) {
    const index = tree.tabs.indexOf(key);
    return index === -1 ? null : [index];
  }
  if (isSplitNode(tree)) {
    for (let index = 0; index < tree.children.length; index++) {
      const childPath = findPathToLeaf(tree.children[index], key);
      if (childPath) {
        return [index, ...childPath];
      }
    }
    return null;
  }
  return tree === key ? [] : null;
}

/**
 * Current path of a dragged leaf. Paths captured during a drag can go stale
 * (the tree may change mid-drag), so this returns the first candidate that
 * still holds `key`, falls back to searching the tree, and returns null if
 * the key is gone.
 */
export function resolveLeafPath<T extends MosaicKey>(
  root: MosaicNode<T> | null,
  key: T | undefined,
  candidates: Array<MosaicPath | undefined>,
): MosaicPath | null {
  if (root == null || key === undefined) {
    return null;
  }
  for (const candidate of candidates) {
    if (candidate && getNodeAtPath(root, candidate) === key) {
      return candidate;
    }
  }
  return findPathToLeaf(root, key);
}
