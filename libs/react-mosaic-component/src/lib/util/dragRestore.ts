import { isEqual } from 'lodash-es';

import { MosaicRootActions } from '../contextTypes';
import { MosaicKey, MosaicNode, MosaicPath, MosaicUpdate } from '../types';
import { createDragToUpdates, updateTree } from './mosaicUpdates';
import { getNodeAtPath, isSplitNode } from './mosaicUtilities';

/**
 * The parent split's sizes from before a drag hid its child, so they can be
 * put back when the drag ends in a swap or is cancelled.
 */
export interface PreDragParentSnapshot {
  parentPath: MosaicPath;
  childCount: number;
  splitPercentages: number[] | undefined;
}

export function snapshotParentBeforeDrag<T extends MosaicKey>(
  root: MosaicNode<T> | null,
  path: MosaicPath,
): PreDragParentSnapshot | undefined {
  if (path.length === 0) {
    return undefined;
  }
  const parentPath = path.slice(0, -1);
  const parent = getNodeAtPath(root, parentPath);
  if (!isSplitNode(parent)) {
    return undefined;
  }
  return {
    parentPath,
    childCount: parent.children.length,
    splitPercentages: parent.splitPercentages,
  };
}

/**
 * Updates that restore the parent's pre-drag sizes. If the parent changed
 * shape during the drag (e.g. a controlled `value` added a child), its panes
 * get equal sizes instead. Returns `null` when there is no split parent to
 * restore.
 */
export function createRestoreParentUpdates<T extends MosaicKey>(
  root: MosaicNode<T>,
  snapshot: PreDragParentSnapshot | undefined,
): MosaicUpdate<T>[] | null {
  if (snapshot === undefined) {
    return null;
  }
  const parent = getNodeAtPath(root, snapshot.parentPath);
  if (!isSplitNode(parent)) {
    return null;
  }
  const stillValid = parent.children.length === snapshot.childCount;
  const target = stillValid ? snapshot.splitPercentages : undefined;
  return [
    {
      path: snapshot.parentPath,
      spec:
        target === undefined
          ? { $unset: ['splitPercentages'] }
          : { splitPercentages: { $set: target } },
    },
  ];
}

/**
 * Finishes a swap drop: puts the parent's sizes back, then trades the two
 * nodes. A swap changes no structure, so the tree is not normalized (that
 * would fill in splitPercentages the tree didn't have).
 */
export function applySwapDrop<T extends MosaicKey>(
  mosaicActions: MosaicRootActions<T>,
  sourcePath: MosaicPath,
  destinationPath: MosaicPath,
  snapshot: PreDragParentSnapshot | undefined,
): void {
  const root = mosaicActions.getRoot();
  if (root == null) {
    return;
  }
  const restore = createRestoreParentUpdates(root, snapshot) ?? [];
  const restored = updateTree(root, restore);
  mosaicActions.updateTree([
    ...restore,
    ...createDragToUpdates(restored, sourcePath, destinationPath, {
      type: 'swap',
    }),
  ]);
}

/**
 * Undoes the drag-start hide after a cancelled drop. Fires `onChange` (so a
 * controlled parent gets the restored tree back) but not `onRelease`.
 */
export function restoreAfterCancelledDrag<T extends MosaicKey>(
  mosaicActions: MosaicRootActions<T>,
  sourcePath: MosaicPath,
  snapshot: PreDragParentSnapshot | undefined,
): void {
  const root = mosaicActions.getRoot();
  const restore =
    root == null ? null : createRestoreParentUpdates(root, snapshot);
  if (root == null || restore === null) {
    mosaicActions.show(sourcePath, true);
    return;
  }
  // The drag can end before the deferred hide ran; nothing to undo then
  if (isEqual(updateTree(root, restore), root)) {
    return;
  }
  mosaicActions.updateTree(restore, { suppressOnRelease: true });
}
