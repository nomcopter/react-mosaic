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
import * as PropTypes from 'prop-types';
import { MosaicNode, MosaicPath, MosaicUpdate } from './types';

/**
 * Mosaic provides functionality on the context for components within
 * Mosaic to affect the view state.
 */

/**
 * Context provided to everything within Mosaic
 */
export interface MosaicContext<T> {
    mosaicActions: MosaicRootActions<T>;
    mosaicId: string;
}

/**
 * Context provided to everything within a Mosaic Tile
 */
export interface MosaicTileContext<T> extends MosaicContext<T> {
    /**
     * Returns the path to this tile
     */
    getMosaicPath: () => MosaicPath;
}

/**
 * Context provided to everything within a Mosaic Window
 */
export interface MosaicWindowContext<T> extends MosaicTileContext<T> {
    mosaicWindowActions: MosaicWindowActions;
}

/**
 * These actions are used to alter the state of the view tree
 */
export interface MosaicRootActions<T> {
    /**
     * Increases the size of this node and bubbles up the tree
     * @param path Path to node to expand
     * @param percentage Every node in the path up to root will be expanded to this percentage
     */
    expand: (path: MosaicPath, percentage?: number) => void;
    /**
     * Remove the node at `path`
     * @param path
     */
    remove: (path: MosaicPath) => void;
    /**
     * Hide the node at `path` but keep it in the DOM. Used in Drag and Drop
     * @param path
     */
    hide: (path: MosaicPath) => void;
    /**
     * Replace currentNode at `path` with `node`
     * @param path
     * @param node
     */
    replaceWith: (path: MosaicPath, node: MosaicNode<T>) => void;
    /**
     * Atomically applies all updates to the current tree
     * @param updates
     */
    updateTree: (updates: MosaicUpdate<T>[]) => void;
    /**
     * Returns the root of this Mosaic instance
     */
    getRoot: () => MosaicNode<T> | null;
}

export interface MosaicWindowActions {
    /**
     * Fails if no `createNode()` is defined
     * Creates a new node and splits the current node.
     * The current node becomes the `first` and the new node the `second` of the result.
     * `direction` is chosen by querying the DOM and splitting along the longer axis
     */
    split: (...args: any[]) => Promise<void>;
    /**
     * Fails if no `createNode()` is defined
     * Convenience function to call `createNode()` and replace the current node with it.
     */
    replaceWithNew: (...args: any[]) => Promise<void>;
}

/*************************************************************
 * PropTypes for React `contextTypes`
 */

export const MosaicActionsPropType = PropTypes.shape({
    expand: PropTypes.func.isRequired,
    remove: PropTypes.func.isRequired,
    hide: PropTypes.func.isRequired,
    replaceWith: PropTypes.func.isRequired,
    updateTree: PropTypes.func.isRequired,
    getRoot: PropTypes.func.isRequired,
}).isRequired;

export const MosaicPathGetterPropType = PropTypes.func.isRequired;

export const MosaicWindowActionsPropType = PropTypes.shape({
    split: PropTypes.func.isRequired,
    replaceWithNew: PropTypes.func.isRequired,
}).isRequired;

/*************************************************************
 * Bundled PropTypes for convenience
 */

export const MosaicContext = {
    mosaicActions: MosaicActionsPropType,
    mosaicId: PropTypes.string.isRequired,
};

export const MosaicTileContext = {
    ...MosaicContext,
    getMosaicPath: MosaicPathGetterPropType,
};

export const MosaicWindowContext = {
    ...MosaicTileContext,
    mosaicWindowActions: MosaicWindowActionsPropType,
};
