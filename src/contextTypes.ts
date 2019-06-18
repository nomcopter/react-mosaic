import React from 'react';

import { MosaicKey, MosaicNode, MosaicPath, MosaicUpdate } from './types';

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
}

/**
 * Context provided to everything within a Mosaic Window
 */
export interface MosaicWindowContext {
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
   * @param suppressOnRelease (default: false)
   */
  updateTree: (updates: MosaicUpdate<T>[], suppressOnRelease?: boolean) => void;
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
  /**
   * Sets the open state for the tray that holds additional controls
   */
  setAdditionalControlsOpen: (open: boolean) => void;
  /**
   * Returns the path to this window
   */
  getPath: () => MosaicPath;
  /**
   * Enables connecting a different drag source besides the react-mosaic toolbar
   */
  connectDragSource: (connectedElements: React.ReactElement<any>) => React.ReactElement | null;
}

export const MosaicContext = React.createContext<MosaicContext<MosaicKey>>(undefined!);
export const MosaicWindowContext = React.createContext<MosaicWindowContext>(undefined!);
