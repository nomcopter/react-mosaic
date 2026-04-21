import { type Spec } from 'immutability-helper';

import { ReactElement } from 'react';
import { MosaicRootActions } from './contextTypes';

// ================================================================================================
// Legacy Types (For Conversion Only)
// ================================================================================================

/**
 * @deprecated For conversion purposes only. Use `MosaicKey` instead.
 */
export type LegacyMosaicKey = string | number;

/**
 * @deprecated For conversion purposes only. Use `MosaicDirection` instead.
 */
export type LegacyMosaicDirection = 'row' | 'column';

/**
 * @deprecated For conversion purposes only. Use `MosaicNode` instead.
 * Base type for the Mosaic binary tree.
 */
export type LegacyMosaicNode<T extends LegacyMosaicKey> =
  | LegacyMosaicParent<T>
  | T;

/**
 * @deprecated For conversion purposes only. Use `MosaicSplitNode` instead.
 */
export interface LegacyMosaicParent<T extends LegacyMosaicKey> {
  direction: LegacyMosaicDirection;
  first: LegacyMosaicNode<T>;
  second: LegacyMosaicNode<T>;
  splitPercentage?: number;
}

/**
 * @deprecated For conversion purposes only. Use numeric indices for `MosaicPath`.
 */
export type LegacyMosaicBranch = 'first' | 'second';

/**
 * @deprecated For conversion purposes only. Use `MosaicPath` instead.
 */
export type LegacyMosaicPath = LegacyMosaicBranch[];

// ================================================================================================
// New N-ary Mosaic Types
// ================================================================================================

/**
 * A unique identifier for a panel (leaf node) in the mosaic.
 * @see React.Key
 */
export type MosaicKey = string | number;

/**
 * The direction of a split, where 'row' lays out children horizontally
 * and 'column' lays them out vertically.
 */
export type MosaicDirection = 'row' | 'column';

/**
 * A node that splits its children horizontally or vertically.
 */
export interface MosaicSplitNode<T extends MosaicKey> {
  type: 'split';
  direction: MosaicDirection;
  children: MosaicNode<T>[];
  /**
   * An array of numbers representing the percentage of space each child occupies.
   * The sum of all numbers in this array should always be 100.
   * Example: `[30, 70]` or `[25, 50, 25]`.
   * If not provided, children are assumed to have equal size upon first render.
   */
  splitPercentages?: number[];
}

/**
 * A node that holds multiple panels (leaves) in a tabbed interface.
 * A valid TabsNode must contain at least two tabs after normalization.
 */
export interface MosaicTabsNode<T extends MosaicKey> {
  type: 'tabs';
  tabs: T[]; // An array of the panel keys
  /** The index of the currently visible tab. */
  activeTabIndex: number;
}

/**
 * The base type for the Mosaic n-ary tree. It can be a split container,
 * a tab container, or a single panel (leaf).
 * A leaf node is represented simply by its key `T`.
 */
export type MosaicNode<T extends MosaicKey> =
  | MosaicSplitNode<T>
  | MosaicTabsNode<T>
  | T;

/**
 * The path to a node in the n-ary tree, represented by an array of numeric indices.
 * An empty array `[]` refers to the root node.
 */
export type MosaicPath = number[];

/**
 * A specification for an update to the mosaic tree, compatible with `immutability-helper`.
 */
export type MosaicUpdateSpec<T extends MosaicKey> = Spec<MosaicNode<T>>;

export interface MosaicUpdate<T extends MosaicKey> {
  path: MosaicPath;
  spec: MosaicUpdateSpec<T>;
}

/**
 * A function that renders a panel's content, given its key and path.
 */
export type TileRenderer<T extends MosaicKey> = (
  t: T,
  path: MosaicPath,
) => ReactElement;

/**
 * A function that renders the title content for a tab given its key and path.
 * If not provided, the tabKey will be used as the title.
 */
export type TabTitleRenderer<T extends MosaicKey> = (props: {
  tabKey: T;
  index: number;
  isActive: boolean;
  path: MosaicPath;
  mosaicId: string;
}) => React.ReactNode;

/**
 * The close state of a tab.
 */
export type TabCloseState = 'canClose' | 'cannotClose' | 'noClose';

/**
 * A function that determines whether a tab can be closed.
 */
export type TabCanCloseFunction<T extends MosaicKey> = (
  tabKey: T,
  tabs: T[],
  index: number,
  path: MosaicPath,
) => TabCloseState;

/**
 * A function that renders the tab button for a tab.
 * If not provided, the DefaultButton will be used.
 */
export type TabButtonRenderer<T extends MosaicKey> = (props: {
  tabKey: T;
  index: number;
  isActive: boolean;
  path: MosaicPath;
  mosaicId: string;
  onTabClick: () => void;
  mosaicActions: MosaicRootActions<T>;
  renderTabTitle?: TabTitleRenderer<T>;
  canClose?: TabCanCloseFunction<T>;
  onTabClose?: (tabKey: T, index: number) => void;
  tabs: T[];
}) => React.ReactElement;

/**
 * Context passed to per-tab-group renderers.
 */
export interface TabGroupContext<T extends MosaicKey> {
  tabs: T[];
  activeTabIndex: number;
  path: MosaicPath;
  mosaicId: string;
}

/**
 * A function that renders the right-hand controls in the default tab bar —
 * including the add button, split, remove, and any custom buttons. Compose
 * from `DefaultAddTabButton`, `TabSplitButton`, `TabRemoveButton`, or your
 * own elements. The library continues to own the tab-group drag handle and
 * all drop targets.
 */
export type TabToolbarControlsRenderer<T extends MosaicKey> = (
  ctx: TabGroupContext<T>,
) => React.ReactNode;

/**
 * A function that renders the entire toolbar for a tab group.
 * It receives the props for the tab group and a DraggableTab component for making tabs draggable.
 */
export type TabToolbarRenderer<T extends MosaicKey> = (props: {
  tabs: T[];
  activeTabIndex: number;
  path: MosaicPath;
  DraggableTab: React.ComponentType<{
    tabKey: T;
    tabIndex: number;
    children: (dragProps: {
      isDragging: boolean;
      connectDragSource: (
        element: React.ReactElement,
      ) => React.ReactElement | null;
      connectDragPreview: (
        element: React.ReactElement,
      ) => React.ReactElement | null;
    }) => React.ReactElement;
  }>;
}) => React.ReactElement;

/**
 * A function that provides a new node to insert into the tree.
 */
export type CreateNode<T extends MosaicKey> = (
  ...args: any[]
) => Promise<MosaicNode<T>> | MosaicNode<T>;

// ================================================================================================
// Constants and Options
// ================================================================================================

/**
 * Drag type identifier used by `react-dnd`.
 */
export const MosaicDragType = {
  WINDOW: 'MosaicWindow',
};

export interface EnabledResizeOptions {
  minimumPaneSizePercentage?: number; // Default: 10
}

export type ResizeOptions = 'DISABLED' | EnabledResizeOptions;
