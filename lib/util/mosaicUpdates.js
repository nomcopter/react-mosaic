"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var immutability_helper_1 = __importDefault(require("immutability-helper"));
var drop_1 = __importDefault(require("lodash/drop"));
var dropRight_1 = __importDefault(require("lodash/dropRight"));
var isEqual_1 = __importDefault(require("lodash/isEqual"));
var last_1 = __importDefault(require("lodash/last"));
var set_1 = __importDefault(require("lodash/set"));
var take_1 = __importDefault(require("lodash/take"));
var internalTypes_1 = require("../internalTypes");
var mosaicUtilities_1 = require("./mosaicUtilities");
/**
 * Used to prepare `update` for `immutability-helper`
 * @param mosaicUpdate
 * @returns {any}
 */
function buildSpecFromUpdate(mosaicUpdate) {
    if (mosaicUpdate.path.length > 0) {
        return set_1.default({}, mosaicUpdate.path, mosaicUpdate.spec);
    }
    else {
        return mosaicUpdate.spec;
    }
}
exports.buildSpecFromUpdate = buildSpecFromUpdate;
/**
 * Applies `updates` to `root`
 * @param root
 * @param updates
 * @returns {MosaicNode<T>}
 */
function updateTree(root, updates) {
    var currentNode = root;
    updates.forEach(function (mUpdate) {
        currentNode = immutability_helper_1.default(currentNode, buildSpecFromUpdate(mUpdate));
    });
    return currentNode;
}
exports.updateTree = updateTree;
/**
 * Creates a `MosaicUpdate<T>` to remove the node at `path` from `root`
 * @param root
 * @param path
 * @returns {{path: T[], spec: {$set: MosaicNode<T>}}}
 */
function createRemoveUpdate(root, path) {
    var parentPath = dropRight_1.default(path);
    var nodeToRemove = last_1.default(path);
    var siblingPath = parentPath.concat(mosaicUtilities_1.getOtherBranch(nodeToRemove));
    var sibling = mosaicUtilities_1.getAndAssertNodeAtPathExists(root, siblingPath);
    return {
        path: parentPath,
        spec: {
            $set: sibling,
        },
    };
}
exports.createRemoveUpdate = createRemoveUpdate;
function isPathPrefixEqual(a, b, length) {
    return isEqual_1.default(take_1.default(a, length), take_1.default(b, length));
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
function createDragToUpdates(root, sourcePath, destinationPath, position) {
    var destinationNode = mosaicUtilities_1.getAndAssertNodeAtPathExists(root, destinationPath);
    var updates = [];
    var destinationIsParentOfSource = isPathPrefixEqual(sourcePath, destinationPath, destinationPath.length);
    if (destinationIsParentOfSource) {
        // Must explicitly remove source from the destination node
        destinationNode = updateTree(destinationNode, [
            createRemoveUpdate(destinationNode, drop_1.default(sourcePath, destinationPath.length)),
        ]);
    }
    else {
        // Can remove source normally
        updates.push(createRemoveUpdate(root, sourcePath));
        // Have to drop in the correct destination after the source has been removed
        var removedNodeParentIsInPath = isPathPrefixEqual(sourcePath, destinationPath, sourcePath.length - 1);
        if (removedNodeParentIsInPath) {
            destinationPath.splice(sourcePath.length - 1, 1);
        }
    }
    var sourceNode = mosaicUtilities_1.getAndAssertNodeAtPathExists(root, sourcePath);
    var first;
    var second;
    if (position === internalTypes_1.MosaicDropTargetPosition.LEFT || position === internalTypes_1.MosaicDropTargetPosition.TOP) {
        first = sourceNode;
        second = destinationNode;
    }
    else {
        first = destinationNode;
        second = sourceNode;
    }
    var direction = 'column';
    if (position === internalTypes_1.MosaicDropTargetPosition.LEFT || position === internalTypes_1.MosaicDropTargetPosition.RIGHT) {
        direction = 'row';
    }
    updates.push({
        path: destinationPath,
        spec: {
            $set: { first: first, second: second, direction: direction },
        },
    });
    return updates;
}
exports.createDragToUpdates = createDragToUpdates;
/**
 * Sets the splitPercentage to hide the node at `path`
 * @param path
 * @returns {{path: T[], spec: {splitPercentage: {$set: number}}}}
 */
function createHideUpdate(path) {
    var targetPath = dropRight_1.default(path);
    var thisBranch = last_1.default(path);
    var splitPercentage;
    if (thisBranch === 'first') {
        splitPercentage = 0;
    }
    else {
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
exports.createHideUpdate = createHideUpdate;
/**
 * Sets the splitPercentage of node at `path` and all of its parents to `percentage` in order to expand it
 * @param path
 * @param percentage
 * @returns {{spec: MosaicUpdateSpec<T>, path: Array}}
 */
function createExpandUpdate(path, percentage) {
    var _a;
    var spec = {};
    for (var i = path.length - 1; i >= 0; i--) {
        var branch = path[i];
        var splitPercentage = branch === 'first' ? percentage : 100 - percentage;
        spec = (_a = {
                splitPercentage: {
                    $set: splitPercentage,
                }
            },
            _a[branch] = spec,
            _a);
    }
    return {
        spec: spec,
        path: [],
    };
}
exports.createExpandUpdate = createExpandUpdate;
//# sourceMappingURL=mosaicUpdates.js.map