"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var clone_1 = __importDefault(require("lodash/clone"));
var get_1 = __importDefault(require("lodash/get"));
function alternateDirection(node, direction) {
    if (direction === void 0) { direction = 'row'; }
    if (isParent(node)) {
        var nextDirection = getOtherDirection(direction);
        return {
            direction: direction,
            first: alternateDirection(node.first, nextDirection),
            second: alternateDirection(node.second, nextDirection),
        };
    }
    else {
        return node;
    }
}
var Corner;
(function (Corner) {
    Corner[Corner["TOP_LEFT"] = 1] = "TOP_LEFT";
    Corner[Corner["TOP_RIGHT"] = 2] = "TOP_RIGHT";
    Corner[Corner["BOTTOM_LEFT"] = 3] = "BOTTOM_LEFT";
    Corner[Corner["BOTTOM_RIGHT"] = 4] = "BOTTOM_RIGHT";
})(Corner = exports.Corner || (exports.Corner = {}));
/**
 * Returns `true` if `node` is a MosaicParent
 * @param node
 * @returns {boolean}
 */
function isParent(node) {
    return node.direction != null;
}
exports.isParent = isParent;
/**
 * Creates a balanced binary tree from `leaves` with the goal of making them as equal area as possible
 * @param leaves
 * @param startDirection
 * @returns {MosaicNode<T>}
 */
function createBalancedTreeFromLeaves(leaves, startDirection) {
    if (startDirection === void 0) { startDirection = 'row'; }
    if (leaves.length === 0) {
        return null;
    }
    var current = clone_1.default(leaves);
    var next = [];
    while (current.length > 1) {
        while (current.length > 0) {
            if (current.length > 1) {
                next.push({
                    direction: 'row',
                    first: current.shift(),
                    second: current.shift(),
                });
            }
            else {
                next.unshift(current.shift());
            }
        }
        current = next;
        next = [];
    }
    return alternateDirection(current[0], startDirection);
}
exports.createBalancedTreeFromLeaves = createBalancedTreeFromLeaves;
/**
 * Gets the sibling of `branch`
 * @param branch
 * @returns {any}
 */
function getOtherBranch(branch) {
    if (branch === 'first') {
        return 'second';
    }
    else if (branch === 'second') {
        return 'first';
    }
    else {
        throw new Error("Branch '" + branch + "' not a valid branch");
    }
}
exports.getOtherBranch = getOtherBranch;
/**
 * Gets the opposite of `direction`
 * @param direction
 * @returns {any}
 */
function getOtherDirection(direction) {
    if (direction === 'row') {
        return 'column';
    }
    else {
        return 'row';
    }
}
exports.getOtherDirection = getOtherDirection;
/**
 * Traverses `tree` to find the path to the specified `corner`
 * @param tree
 * @param corner
 * @returns {MosaicPath}
 */
function getPathToCorner(tree, corner) {
    var currentNode = tree;
    var currentPath = [];
    while (isParent(currentNode)) {
        if (currentNode.direction === 'row' && (corner === Corner.TOP_LEFT || corner === Corner.BOTTOM_LEFT)) {
            currentPath.push('first');
            currentNode = currentNode.first;
        }
        else if (currentNode.direction === 'column' && (corner === Corner.TOP_LEFT || corner === Corner.TOP_RIGHT)) {
            currentPath.push('first');
            currentNode = currentNode.first;
        }
        else {
            currentPath.push('second');
            currentNode = currentNode.second;
        }
    }
    return currentPath;
}
exports.getPathToCorner = getPathToCorner;
/**
 * Gets all leaves of `tree`
 * @param tree
 * @returns {T[]}
 */
function getLeaves(tree) {
    if (tree == null) {
        return [];
    }
    else if (isParent(tree)) {
        return getLeaves(tree.first).concat(getLeaves(tree.second));
    }
    else {
        return [tree];
    }
}
exports.getLeaves = getLeaves;
/**
 * Gets node at `path` from `tree`
 * @param tree
 * @param path
 * @returns {MosaicNode<T>|null}
 */
function getNodeAtPath(tree, path) {
    if (path.length > 0) {
        return get_1.default(tree, path, null);
    }
    else {
        return tree;
    }
}
exports.getNodeAtPath = getNodeAtPath;
/**
 * Gets node at `path` from `tree` and verifies that neither `tree` nor the result are null
 * @param tree
 * @param path
 * @returns {MosaicNode<T>}
 */
function getAndAssertNodeAtPathExists(tree, path) {
    if (tree == null) {
        throw new Error('Root is empty, cannot fetch path');
    }
    var node = getNodeAtPath(tree, path);
    if (node == null) {
        throw new Error("Path [" + path.join(', ') + "] did not resolve to a node");
    }
    return node;
}
exports.getAndAssertNodeAtPathExists = getAndAssertNodeAtPathExists;
//# sourceMappingURL=mosaicUtilities.js.map