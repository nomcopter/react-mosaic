/**
 * @license
 * Copyright 2016 Palantir Technologies, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import * as update from 'immutability-helper';
import * as _ from 'lodash';
import { MosaicDropTargetPosition } from '../internalTypes';
import {
  MosaicBranch,
  MosaicDirection,
  MosaicKey,
  MosaicNode,
  MosaicParent,
  MosaicPath,
  MosaicUpdate,
  MosaicUpdateSpec,
} from '../types';
import { getAndAssertNodeAtPathExists, getOtherBranch } from './mosaicUtilities';

// https://github.com/Microsoft/TypeScript/issues/9944
export { MosaicParent };

/**
 * Used to prepare `update` for `immutability-helper`
 * @param mosaicUpdate
 * @returns {any}
 */
export function buildSpecFromUpdate<T extends MosaicKey>(mosaicUpdate: MosaicUpdate<T>): MosaicUpdateSpec<T> {
  if (mosaicUpdate.path.length > 0) {
    return _.set({}, mosaicUpdate.path, mosaicUpdate.spec);
  } else {
    return mosaicUpdate.spec;
  }
}

/**
 * Applies `updates` to `root`
 * @param root
 * @param updates
 * @returns {MosaicNode<T>}
 */
export function updateTree<T extends MosaicKey>(root: MosaicNode<T>, updates: MosaicUpdate<T>[]) {
  let currentNode = root;
  updates.forEach((mUpdate: MosaicUpdate<T>) => {
    currentNode = update(currentNode, buildSpecFromUpdate(mUpdate));
  });

  return currentNode;
}

/**
 * Creates a `MosaicUpdate<T>` to remove the node at `path` from `root`
 * @param root
 * @param path
 * @returns {{path: T[], spec: {$set: MosaicNode<T>}}}
 */
export function createRemoveUpdate<T extends MosaicKey>(root: MosaicNode<T> | null, path: MosaicPath): MosaicUpdate<T> {
  const parentPath = _.dropRight(path);
  const nodeToRemove = _.last(path);
  const siblingPath = parentPath.concat(getOtherBranch(nodeToRemove!));
  const sibling = getAndAssertNodeAtPathExists(root, siblingPath);

  return {
    path: parentPath,
    spec: {
      $set: sibling,
    },
  };
}

function isPathPrefixEqual(a: MosaicPath, b: MosaicPath, length: number) {
  return _.isEqual(_.take(a, length), _.take(b, length));
}

/**
 * Creates a `MosaicUpdate<T>` to split the _leaf_ at `destinationPath` into a node of it and the node from `sourcePath`
 * placing the node from `sourcePath` in `position`.
 * @param root
 * @param sourcePath
 * @param destinationPath
 * @param position
 * @returns {(MosaicUpdate<T>|{path: MosaicPath, spec: {$set: {first: MosaicNode<T>, second: MosaicNode<T>, direction: MosaicDirection}}})[]}
 */
export function createDragToUpdates<T extends MosaicKey>(
  root: MosaicNode<T>,
  sourcePath: MosaicPath,
  destinationPath: MosaicPath,
  position: MosaicDropTargetPosition,
): MosaicUpdate<T>[] {
  let destinationNode = getAndAssertNodeAtPathExists(root, destinationPath);
  const updates: MosaicUpdate<T>[] = [];

  const destinationIsParentOfSource = isPathPrefixEqual(sourcePath, destinationPath, destinationPath.length);
  if (destinationIsParentOfSource) {
    // Must explicitly remove source from the destination node
    destinationNode = updateTree(destinationNode, [
      createRemoveUpdate(destinationNode, _.drop(sourcePath, destinationPath.length)),
    ]);
  } else {
    // Can remove source normally
    updates.push(createRemoveUpdate(root, sourcePath));

    // Have to drop in the correct destination after the source has been removed
    const removedNodeParentIsInPath = isPathPrefixEqual(sourcePath, destinationPath, sourcePath.length - 1);
    if (removedNodeParentIsInPath) {
      destinationPath.splice(sourcePath.length - 1, 1);
    }
  }

  const sourceNode = getAndAssertNodeAtPathExists(root, sourcePath);
  let first: MosaicNode<T>;
  let second: MosaicNode<T>;
  if (position === MosaicDropTargetPosition.LEFT || position === MosaicDropTargetPosition.TOP) {
    first = sourceNode;
    second = destinationNode;
  } else {
    first = destinationNode;
    second = sourceNode;
  }

  let direction: MosaicDirection = 'column';
  if (position === MosaicDropTargetPosition.LEFT || position === MosaicDropTargetPosition.RIGHT) {
    direction = 'row';
  }

  updates.push({
    path: destinationPath,
    spec: {
      $set: { first, second, direction },
    },
  });

  return updates;
}

/**
 * Sets the splitPercentage to hide the node at `path`
 * @param path
 * @returns {{path: T[], spec: {splitPercentage: {$set: number}}}}
 */
export function createHideUpdate<T extends MosaicKey>(path: MosaicPath): MosaicUpdate<T> {
  const targetPath = _.dropRight(path);
  const thisBranch = _.last(path);

  let splitPercentage: number;
  if (thisBranch === 'first') {
    splitPercentage = 0;
  } else {
    splitPercentage = 100;
  }

  return {
    path: targetPath,
    spec: {
      splitPercentage: {
        $set: splitPercentage,
      },
    },
  };
}

/**
 * Sets the splitPercentage of node at `path` and all of its parents to `percentage` in order to expand it
 * @param path
 * @param percentage
 * @returns {{spec: MosaicUpdateSpec<T>, path: Array}}
 */
export function createExpandUpdate<T extends MosaicKey>(path: MosaicPath, percentage: number): MosaicUpdate<T> {
  let spec: MosaicUpdateSpec<T> = {};
  for (let i = path.length - 1; i >= 0; i--) {
    const branch: MosaicBranch = path[i];
    const splitPercentage = branch === 'first' ? percentage : 100 - percentage;
    spec = {
      splitPercentage: {
        $set: splitPercentage,
      },
      [branch]: spec,
    };
  }

  return {
    spec,
    path: [],
  };
}
