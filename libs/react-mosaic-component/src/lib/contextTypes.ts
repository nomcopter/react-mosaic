import React from 'react';

import {
  CreateNode,
  MosaicKey,
  MosaicNode,
  MosaicPath,
  MosaicUpdate,
} from './types';

/**
 * Mosaic provides functionality on the context for components within
 * Mosaic to affect the view state.
 */

/**
 * Context provided to everything within Mosaic
 */
export interface MosaicContext<T extends MosaicKey> {
  mosaicActions: MosaicRootActions<T>;
  mosaicId: string;
  blueprintNamespace: string;
}

/**
 * Context provided to everything within a Mosaic Window
 */
export interface MosaicWindowContext {
  blueprintNamespace: string;
  mosaicWindowActions: MosaicWindowActions;
}

/**
 * These actions are used to alter the state of the view tree
 */
export interface MosaicRootActions<T extends MosaicKey> {
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
   * @param suppressOnChange (default: false) - if true, won't trigger onChange event
   */
  hide: (path: MosaicPath, suppressOnChange?: boolean) => void;

  /**
   * Show a previously hidden node.
   * This is used to restore a component if a drag operation is cancelled.
   * @param path
   * @param suppressOnChange (default: false) - if true, won't trigger onChange event
   */
  show: (path: MosaicPath, suppressOnChange?: boolean) => void;

  createNode?: CreateNode<T>;

  /**
   * Adds a new tab at `path`, dispatching on the node kind:
   * - tab-group → append the new tab and make it active
   * - leaf → replace the leaf with a 2-tab group containing the original and the new tab
   * Rejects if `createNode` is not set, or if `path` resolves to a split node.
   */
  addTab: (path: MosaicPath, ...args: any[]) => Promise<void>;

  /**
   * Removes the tab at `index` from the tab-group at `path`. Adjusts
   * `activeTabIndex` and normalizes the tree (collapsing a tab-group with a
   * single remaining child back to a leaf). No-op if `path` doesn't resolve
   * to a tab-group or the index is out of range.
   */
  removeTab: (path: MosaicPath, index: number) => void;

  /**
   * Replace currentNode at `path` with `node`
   * @param path
   * @param node
   */
  replaceWith: (path: MosaicPath, node: MosaicNode<T>) => void;
  /**
   * Atomically applies all updates to the current tree
   * @param updates
   * @param suppressOnRelease (default: false)
   */
  updateTree: (
    updates: MosaicUpdate<T>[],
    modifiers?: {
      suppressOnRelease?: boolean;
      suppressOnChange?: boolean;
      shouldNormalize?: boolean;
    },
  ) => void;
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
   * Creates a new tab node and replaces the current node.
   * The current node becomes the first tab and the new node the second tab of the result.
   */
  addTab: (...args: any[]) => Promise<void>;
  /**
   * Returns the root of this Mosaic instance
   */
  getRoot: () => MosaicNode<MosaicKey> | null;
  /**
   * Fails if no `createNode()` is defined
   * Convenience function to call `createNode()` and replace the current node with it.
   */
  replaceWithNew: (...args: any[]) => Promise<void>;
  /**
   * Sets the open state for the tray that holds additional controls.
   * Pass 'toggle' to invert the current state.
   */
  setAdditionalControlsOpen: (open: boolean | 'toggle') => void;
  /**
   * Returns the path to this window
   */
  getPath: () => MosaicPath;
  /**
   * Enables connecting a different drag source besides the react-mosaic toolbar
   */
  connectDragSource: (
    connectedElements: React.ReactElement<any>,
  ) => React.ReactElement | null;
}

export const MosaicContext = React.createContext<MosaicContext<MosaicKey>>(
  undefined!,
);
export const MosaicWindowContext = React.createContext<MosaicWindowContext>(
  undefined!,
);
