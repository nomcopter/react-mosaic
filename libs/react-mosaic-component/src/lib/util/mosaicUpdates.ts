import update, { Spec } from 'immutability-helper';
import { dropRight, isEqual, set } from 'lodash-es';
import { DropInfo, MosaicDropTargetPosition } from '../internalTypes';

import type {
  MosaicDirection,
  MosaicKey,
  MosaicNode,
  MosaicPath,
  MosaicUpdate,
  MosaicUpdateSpec,
} from '../types';
import {
  getAndAssertNodeAtPathExists,
  getNodeAtPath,
  getParentAndChildIndex,
  isSplitNode,
  isTabsNode,
} from './mosaicUtilities';
import { assertNever } from './assertNever';

/**
 * Used to prepare `update` for `immutability-helper`
 * @param mosaicUpdate
 * @returns {any}
 */
export function buildSpecFromUpdate<T extends MosaicKey>(
  mosaicUpdate: MosaicUpdate<T>,
): MosaicUpdateSpec<T> {
  if (mosaicUpdate.path.length > 0) {
    return set({}, mosaicUpdate.path, mosaicUpdate.spec);
  } else {
    return mosaicUpdate.spec;
  }
}

/**
 * Creates a nested spec for immutability-helper that targets a specific path.
 * This is necessary because immutability-helper needs a nested object structure
 * to update deep into the tree.
 *
 * @param tree The full tree, used to determine if a path segment refers to `children` (of a split) or `tabs` (of a tab group).
 * @param path The path to the node to be updated.
 * @param spec The spec to apply at the target node.
 * @returns A nested spec object that immutability-helper can use.
 */
function buildSpecFromPath<T extends MosaicKey>(
  tree: MosaicNode<T>,
  path: MosaicPath,
  spec: Spec<MosaicNode<T>>,
): Spec<MosaicNode<T>> {
  return path.reduceRight<Spec<MosaicNode<T>>>((acc, pathSegment, index) => {
    // Get the parent of the current segment to know its type
    const parentPath = path.slice(0, index);
    const parentNode = getNodeAtPath(tree, parentPath);

    let property: 'children' | 'tabs' = 'children'; // Default to 'children' for split nodes
    if (
      parentNode &&
      typeof parentNode === 'object' &&
      'type' in parentNode &&
      parentNode.type === 'tabs'
    ) {
      property = 'tabs';
    }

    return {
      [property]: {
        [pathSegment]: acc,
      },
    };
  }, spec);
}

/**
 * Applies a list of updates to a tree and returns the new tree.
 *
 * @param tree The tree to be updated.
 * @param updates An array of MosaicUpdate objects.
 * @returns The new, updated tree.
 */
export function updateTree<T extends MosaicKey>(
  tree: MosaicNode<T>,
  updates: MosaicUpdate<T>[],
): MosaicNode<T> {
  if (updates.length === 0) {
    return tree;
  }

  let currentTree = tree;
  // We apply updates sequentially. This is important if one update affects the path of a subsequent one.
  for (const { path, spec } of updates) {
    // If the path is to the root, we just apply the spec to the whole tree.
    if (path.length === 0) {
      currentTree = update(currentTree, spec);
    } else {
      // Build the nested spec and then apply it.
      const nestedSpec = buildSpecFromPath(currentTree, path, spec);
      currentTree = update(currentTree, nestedSpec);
    }
  }

  return currentTree;
}

/**
 * Creates a `MosaicUpdate<T>` to remove the node at `path` from `root`
 * @param root
 * @param path
 * @returns {{path: MosaicPath, spec: MosaicUpdateSpec<T>}}
 */
export function createRemoveUpdate<T extends MosaicKey>(
  root: MosaicNode<T> | null,
  path: MosaicPath,
): MosaicUpdate<T> {
  if (path.length === 0) {
    throw new Error('Cannot remove root node');
  }

  const parentInfo = getParentAndChildIndex(root!, path);
  if (!parentInfo) {
    throw new Error('Cannot find parent for removal');
  }

  const { parent, childIndex } = parentInfo;

  if (isSplitNode(parent)) {
    if (parent.children.length === 2) {
      // If parent has only 2 children, replace parent with the sibling
      const siblingIndex = childIndex === 0 ? 1 : 0;
      const sibling = parent.children[siblingIndex];

      return {
        path: dropRight(path),
        spec: {
          $set: sibling,
        },
      };
    } else {
      // If parent has more than 2 children, just remove this child and adjust percentages
      const newChildren = parent.children.filter(
        (_, index) => index !== childIndex,
      );
      const oldPercentages =
        parent.splitPercentages ||
        Array(parent.children.length).fill(100 / parent.children.length);

      // Redistribute the removed child's percentage equally among remaining children
      const removedPercentage = oldPercentages[childIndex];
      const redistributeAmount = removedPercentage / newChildren.length;

      const newPercentages = oldPercentages
        .filter((_, index) => index !== childIndex)
        .map((percentage) => percentage + redistributeAmount);

      return {
        path: dropRight(path),
        spec: {
          children: { $set: newChildren },
          splitPercentages: { $set: newPercentages },
        },
      };
    }
  } else if (isTabsNode(parent)) {
    // Remove tab from tabs node
    const newTabs = parent.tabs.filter((_, index) => index !== childIndex);

    if (newTabs.length === 0) {
      throw new Error('Cannot remove last tab from tabs node');
    }

    // Adjust active tab if necessary
    let newActiveTabIndex = parent.activeTabIndex;
    if (childIndex === parent.activeTabIndex) {
      // If removing active tab, set to previous tab or first tab
      newActiveTabIndex = childIndex > 0 ? childIndex - 1 : 0;
    } else if (childIndex < parent.activeTabIndex) {
      // If removing tab before active tab, adjust active index
      newActiveTabIndex = parent.activeTabIndex - 1;
    }

    return {
      path: dropRight(path),
      spec: {
        tabs: { $set: newTabs },
        activeTabIndex: { $set: newActiveTabIndex },
      },
    };
  }

  throw new Error('Invalid parent node type for removal');
}

/**
 * Creates a `MosaicUpdate<T>` to split the _leaf_ at `destinationPath` into a node of it and the node from `sourcePath`
 * placing the node from `sourcePath` in `position`.
 * @param root
 * @param sourcePath
 * @param destinationPath
 * @param dropInfo
 * @returns {MosaicUpdate<T>[]}
 */
export function createDragToUpdates<T extends MosaicKey>(
  root: MosaicNode<T>,
  sourcePath: MosaicPath,
  destinationPath: MosaicPath,
  dropInfo: DropInfo,
): MosaicUpdate<T>[] {
  // If source and destination are identical, this is a no-op
  if (isEqual(sourcePath, destinationPath)) {
    return [];
  }

  const destinationNode = getAndAssertNodeAtPathExists(root, destinationPath);
  const sourceNode = getAndAssertNodeAtPathExists(root, sourcePath);

  switch (dropInfo.type) {
    case 'tab-container':
    case 'tab-reorder': {
      // --- Dragging INTO a TabContainer ---
      if (!isTabsNode(destinationNode)) {
        throw new Error(
          `Expected tab container at destination path ${destinationPath.join(', ')}, but found: ${JSON.stringify(destinationNode)}`,
        );
      }

      const updates: MosaicUpdate<T>[] = [];

      // Remove source from its current location
      updates.push(createRemoveUpdate(root, sourcePath));

      // Calculate the adjusted destination path after removal
      let adjustedDestinationPath = adjustPathAfterRemoval(
        sourcePath,
        destinationPath,
      );

      // Get the destination node after the removal to ensure it's still a tabs node
      const rootAfterRemoval = updateTree(root, updates);
      let destinationAfterRemoval = getNodeAtPath(
        rootAfterRemoval,
        adjustedDestinationPath,
      );

      // If the adjusted path is invalid or doesn't point to a tabs node, find the original tabs node
      if (!destinationAfterRemoval || !isTabsNode(destinationAfterRemoval)) {
        // Function to recursively search for a tabs node with matching tabs array
        function findTabsNodeInTree(
          node: MosaicNode<T>,
          currentPath: MosaicPath = [],
        ): { node: MosaicNode<T>; path: MosaicPath } | null {
          if (node && typeof node === 'object') {
            if (
              isTabsNode(node) &&
              isTabsNode(destinationNode) &&
              node.tabs &&
              JSON.stringify(node.tabs) === JSON.stringify(destinationNode.tabs)
            ) {
              return { node, path: currentPath };
            }
            if (isSplitNode(node)) {
              for (let i = 0; i < node.children.length; i++) {
                const result = findTabsNodeInTree(node.children[i], [
                  ...currentPath,
                  i,
                ]);
                if (result) {
                  return result;
                }
              }
            }
          }
          return null;
        }

        // Search for the original tabs node in the tree after removal
        const result = findTabsNodeInTree(rootAfterRemoval);
        if (result) {
          adjustedDestinationPath = result.path;
          destinationAfterRemoval = result.node;
        }
      }

      if (!destinationAfterRemoval || !isTabsNode(destinationAfterRemoval)) {
        throw new Error(
          `Could not find tabs container after removal. Original path: ${destinationPath.join(', ')}, Adjusted path: ${adjustedDestinationPath.join(', ')}`,
        );
      }

      // Add the dragged node as a new tab
      if (dropInfo.type === 'tab-reorder') {
        // Insert at specific index
        const newTabs = [...destinationAfterRemoval.tabs];
        newTabs.splice(dropInfo.insertIndex, 0, sourceNode as T);

        updates.push({
          path: adjustedDestinationPath,
          spec: {
            tabs: { $set: newTabs },
            activeTabIndex: { $set: dropInfo.insertIndex }, // Make the inserted tab active
          },
        });
      } else {
        // Add to end
        updates.push({
          path: adjustedDestinationPath,
          spec: {
            tabs: { $push: [sourceNode as T] },
            activeTabIndex: { $set: destinationAfterRemoval.tabs.length },
          },
        });
      }

      return updates;
    }
    case 'split': {
      // --- Split logic ---
      const updates: MosaicUpdate<T>[] = [];

      // Remove the source node
      updates.push(createRemoveUpdate(root, sourcePath));

      // Calculate the adjusted destination path after removal
      let adjustedDestinationPath = adjustPathAfterRemoval(
        sourcePath,
        destinationPath,
      );

      // Get the destination node after the source removal
      const rootAfterRemoval = updateTree(root, updates);

      // Check if the adjusted destination path is still valid
      let destinationAfterRemoval = getNodeAtPath(
        rootAfterRemoval,
        adjustedDestinationPath,
      );

      // If the adjusted path is invalid, try to find a valid alternative
      if (!destinationAfterRemoval) {
        // Try progressively shorter paths to find a valid parent
        for (let i = adjustedDestinationPath.length - 1; i >= 0; i--) {
          const shorterPath = adjustedDestinationPath.slice(0, i);
          const nodeAtShorterPath = getNodeAtPath(
            rootAfterRemoval,
            shorterPath,
          );
          if (nodeAtShorterPath) {
            adjustedDestinationPath = shorterPath;
            destinationAfterRemoval = nodeAtShorterPath;
            break;
          }
        }

        // If we still can't find a valid path, fall back to root
        if (!destinationAfterRemoval) {
          adjustedDestinationPath = [];
          destinationAfterRemoval = rootAfterRemoval;
        }
      }

      if (!destinationAfterRemoval) {
        console.error(
          'Could not find valid destination after removing source from:',
          sourcePath,
          'original destination was:',
          destinationPath,
        );
        throw new Error(
          `Could not find valid destination after removing source from [${sourcePath.join(', ')}]`,
        );
      }

      // Determine split direction
      let direction: MosaicDirection = 'column';
      if (
        dropInfo.position === MosaicDropTargetPosition.LEFT ||
        dropInfo.position === MosaicDropTargetPosition.RIGHT
      ) {
        direction = 'row';
      }

      // Check if we can add to an existing split with the same direction
      if (
        isSplitNode(destinationAfterRemoval) &&
        destinationAfterRemoval.direction === direction
      ) {
        // Insert at the correct index
        const insertIndex =
          dropInfo.position === MosaicDropTargetPosition.LEFT ||
          dropInfo.position === MosaicDropTargetPosition.TOP
            ? 0
            : destinationAfterRemoval.children.length;

        updates.push(
          createAddChildUpdate(
            adjustedDestinationPath,
            sourceNode,
            insertIndex,
          ),
        );
      } else {
        // Create a new split node
        let first: MosaicNode<T>;
        let second: MosaicNode<T>;

        if (
          dropInfo.position === MosaicDropTargetPosition.LEFT ||
          dropInfo.position === MosaicDropTargetPosition.TOP
        ) {
          first = sourceNode;
          second = destinationAfterRemoval;
        } else {
          first = destinationAfterRemoval;
          second = sourceNode;
        }

        updates.push({
          path: adjustedDestinationPath,
          spec: {
            $set: {
              type: 'split',
              direction,
              children: [first, second],
              splitPercentages: [50, 50],
            },
          },
        });
      }

      return updates;
    }

    default:
      assertNever(dropInfo);
  }
}

/**
 * Adjusts a path after a node removal to account for index changes and structural changes
 */
function adjustPathAfterRemoval(
  removedPath: MosaicPath,
  targetPath: MosaicPath,
): MosaicPath {
  // If the target path is not affected by the removal, return it as is
  if (removedPath.length === 0 || targetPath.length === 0) {
    return targetPath;
  }

  // If the paths are identical, the target will be removed, so it's invalid
  if (isEqual(removedPath, targetPath)) {
    return [];
  }

  // Check if the target path is in the same parent as the removed path
  const removedParentPath = removedPath.slice(0, -1);
  const targetParentPath = targetPath.slice(0, -1);

  // If they don't share the same parent path prefix, no adjustment needed
  if (!isEqual(removedParentPath, targetParentPath)) {
    return targetPath;
  }

  // If they share the same parent, we need to consider structural changes
  const removedIndex = removedPath[removedPath.length - 1];
  const targetIndex = targetPath[targetPath.length - 1];

  if (typeof removedIndex === 'number' && typeof targetIndex === 'number') {
    // Special case: if the parent is a 2-child split, removing one child
    // will cause the parent to be replaced by the remaining child
    // In this case, we need to adjust the path by removing the parent level

    // We can't easily determine this without the actual tree structure,
    // so we'll handle this in the calling function by checking if the
    // adjusted path is valid after the removal

    if (targetIndex > removedIndex) {
      // Target index needs to be decremented
      const adjustedPath = [...targetPath];
      adjustedPath[adjustedPath.length - 1] = targetIndex - 1;
      return adjustedPath;
    }
  }

  return targetPath;
}

/**
 * Sets the splitPercentages to hide the node at `path`
 * @param root
 * @param path
 * @returns {{path: MosaicPath, spec: MosaicUpdateSpec<T>}}
 */
export function createHideUpdate<T extends MosaicKey>(
  root: MosaicNode<T> | null,
  path: MosaicPath,
): MosaicUpdate<T> {
  if (path.length === 0) {
    throw new Error('Cannot hide root node');
  }

  const parentInfo = getParentAndChildIndex(root, path);
  if (!parentInfo) {
    throw new Error('Cannot hide node: parent not found');
  }

  const { parent, childIndex } = parentInfo;

  if (isSplitNode(parent)) {
    const currentPercentages =
      parent.splitPercentages ||
      Array(parent.children.length).fill(100 / parent.children.length);

    // Set the target child's percentage to 0 and redistribute to others
    const hidePercentage = currentPercentages[childIndex];
    const otherIndices = currentPercentages
      .map((_, i) => i)
      .filter((i) => i !== childIndex);

    if (otherIndices.length === 0) {
      // Only one child, can't hide it by setting percentage to 0
      throw new Error('Cannot hide the only child of a split node');
    }

    const redistributeAmount = hidePercentage / otherIndices.length;

    const newPercentages = currentPercentages.map((percentage, index) => {
      if (index === childIndex) {
        return 0;
      } else {
        return percentage + redistributeAmount;
      }
    });

    return {
      path: dropRight(path),
      spec: {
        splitPercentages: {
          $set: newPercentages,
        },
      },
    };
  } else if (isTabsNode(parent)) {
    // For tab containers, we can't really "hide" a tab by setting percentages
    // Instead, we'll just set the active tab to a different one if possible
    // This is more of a visual hide than a structural one
    if (parent.tabs.length <= 1) {
      throw new Error('Cannot hide the only tab in a tab container');
    }

    let newActiveTabIndex = parent.activeTabIndex;
    if (childIndex === parent.activeTabIndex) {
      // If hiding the active tab, switch to another tab
      newActiveTabIndex = childIndex > 0 ? childIndex - 1 : childIndex + 1;
    }

    return {
      path: dropRight(path),
      spec: {
        activeTabIndex: { $set: newActiveTabIndex },
      },
    };
  }

  throw new Error('Cannot hide node: parent is not a split or tabs node');
}

/**
 * Sets the splitPercentages of node at `path` and all of its parents to expand the target node
 * @param path
 * @param percentage
 * @returns {{spec: MosaicUpdateSpec<T>, path: MosaicPath}}
 */
export function createExpandUpdate<T extends MosaicKey>(
  path: MosaicPath,
  percentage: number,
): MosaicUpdate<T> {
  let spec: MosaicUpdateSpec<T> = {};

  for (let i = path.length - 1; i >= 0; i--) {
    const childIndex: number =
      typeof path[i] === 'number' ? (path[i] as number) : Number(path[i]);
    const childSpec = spec;

    // Works on the whole node rather than on `splitPercentages` alone, because
    // that field is optional and the new percentages depend on the number of
    // children. Tabs nodes have no percentages and only hold leaves, so the
    // walk stops there.
    spec = {
      $apply: (node: MosaicNode<T>): MosaicNode<T> => {
        if (!isSplitNode(node)) {
          return node;
        }

        const otherChildrenCount = node.children.length - 1;
        const otherChildPercentage =
          otherChildrenCount > 0 ? (100 - percentage) / otherChildrenCount : 0;
        const splitPercentages =
          otherChildrenCount > 0
            ? node.children.map((_, j) =>
                j === childIndex ? percentage : otherChildPercentage,
              )
            : [100];

        return {
          ...node,
          splitPercentages,
          children: node.children.map((child, j) =>
            j === childIndex ? update(child, childSpec) : child,
          ),
        };
      },
    };
  }

  return {
    spec,
    path: [],
  };
}

/**
 * Helper function to create an update that adds a new child to a split node
 * @param path Path to the split node
 * @param newChild The new child to add
 * @param insertIndex Index where to insert the new child (optional, defaults to end)
 * @returns MosaicUpdate to add the child
 */
export function createAddChildUpdate<T extends MosaicKey>(
  path: MosaicPath,
  newChild: MosaicNode<T>,
  insertIndex?: number,
): MosaicUpdate<T> {
  return {
    path,
    spec: {
      // Works on the whole node: `splitPercentages` is optional, so its new
      // length has to come from the children, not from the old percentages.
      $apply: (node: MosaicNode<T>): MosaicNode<T> => {
        if (!isSplitNode(node)) {
          throw new Error('Cannot add child: node at path is not a split');
        }

        const children = [...node.children];
        const index = insertIndex !== undefined ? insertIndex : children.length;
        children.splice(index, 0, newChild);

        // Redistribute percentages equally
        const equalPercentage = 100 / children.length;
        return {
          ...node,
          children,
          splitPercentages: children.map(() => equalPercentage),
        };
      },
    },
  };
}

// Helper function to convert from old API to new union type
export function convertToDropInfo(
  position: MosaicDropTargetPosition | undefined,
  tabReorderIndex?: number,
): DropInfo {
  if (tabReorderIndex !== undefined) {
    return { type: 'tab-reorder', insertIndex: tabReorderIndex };
  } else if (position === undefined) {
    return { type: 'tab-container' };
  } else {
    return { type: 'split', position };
  }
}
