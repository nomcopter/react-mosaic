import classNames from 'classnames';
import { DragDropManager } from 'dnd-core';
import { countBy, keys, pickBy } from 'lodash-es';
import { HTML5toTouch } from 'rdndmb-html5-to-touch';
import React, { ReactElement } from 'react';
import { DndProvider } from 'react-dnd';
import { MultiBackend } from 'react-dnd-multi-backend';
import { v4 as uuid } from 'uuid';
import { useDrop } from 'react-dnd';

import { MosaicContext, MosaicRootActions } from './contextTypes';
import { MosaicRoot } from './MosaicRoot';
import { MosaicZeroState } from './MosaicZeroState';
import { RootDropTargets } from './RootDropTargets';
import {
  CreateNode,
  LegacyMosaicNode,
  MosaicKey,
  MosaicNode,
  MosaicPath,
  MosaicUpdate,
  ResizeOptions,
  TabToolbarRenderer,
  TileRenderer,
  MosaicDragType,
  TabTitleRenderer,
  TabButtonRenderer,
  TabCanCloseFunction,
  TabToolbarControlsRenderer,
  AddTabButtonRenderer,
} from './types';
import {
  createExpandUpdate,
  createHideUpdate,
  createRemoveUpdate,
  updateTree,
} from './util/mosaicUpdates';
import {
  convertLegacyToNary,
  getLeaves,
  getParentAndChildIndex,
  isSplitNode,
  normalizeMosaicTree,
} from './util/mosaicUtilities';

const DEFAULT_EXPAND_PERCENTAGE = 70;

export interface MosaicBaseProps<T extends MosaicKey> {
  /**
   * Lookup function to convert `T` to a displayable `ReactElement`
   */
  renderTile: TileRenderer<T>;
  /**
   * Lookup function to convert tab title to a displayable `ReactElement`
   */
  renderTabToolbar?: TabToolbarRenderer<T>;
  /**
   * Override the right-side controls in the default tab bar (the split / remove
   * cluster). The library keeps ownership of the tab-group drag handle.
   * Ignored when `renderTabToolbar` is provided.
   */
  renderTabToolbarControls?: TabToolbarControlsRenderer<T>;
  /**
   * Override the "+" add-tab button. Return `null` to hide it.
   * Ignored when `renderTabToolbar` is provided.
   */
  renderAddTabButton?: AddTabButtonRenderer<T>;
  /**
   * Function to render custom tab titles
   */
  renderTabTitle?: TabTitleRenderer<T>;
  /**
   * Custom tab button renderer
   */
  renderTabButton?: TabButtonRenderer<T>;
  /**
   * Function to determine if a tab can be closed
   */
  canClose?: TabCanCloseFunction<T>;

  createNode?: CreateNode<T>;
  /**
   * Called when a user initiates any change to the tree (removing, adding, moving, resizing, etc.)
   */
  onChange?: (newNode: MosaicNode<T> | null) => void;
  /**
   * Called when a user completes a change (fires like above except for the interpolation during resizing)
   */
  onRelease?: (newNode: MosaicNode<T> | null) => void;
  /**
   * Additional classes to affix to the root element
   * Default: 'mosaic-blueprint-theme'
   */
  className?: string;
  /**
   * Options that control resizing
   * @see: [[ResizeOptions]]
   */
  resize?: ResizeOptions;
  /**
   * View to display when the current value is `null`
   * default: Simple NonIdealState view
   */
  zeroStateView?: ReactElement;
  /**
   * Override the mosaicId passed to `react-dnd` to control how drag and drop works with other components
   * Note: does not support updating after instantiation
   * default: Random UUID
   */
  mosaicId?: string;
  /**
   * Make it possible to use different versions of Blueprint with `mosaic-blueprint-theme`
   * Note: does not support updating after instantiation
   * default: 'bp3'
   */
  blueprintNamespace?: string;
  /**
   * Override the react-dnd provider to allow applications to inject an existing drag and drop context
   */
  dragAndDropManager?: DragDropManager | undefined;
}

export interface MosaicControlledProps<T extends MosaicKey>
  extends MosaicBaseProps<T> {
  /**
   * The tree to render
   */
  value: LegacyMosaicNode<T> | MosaicNode<T> | null;
  onChange: (newNode: MosaicNode<T> | null) => void;
}

export interface MosaicUncontrolledProps<T extends MosaicKey>
  extends MosaicBaseProps<T> {
  /**
   * The initial tree to render, can be modified by the user
   */
  initialValue: LegacyMosaicNode<T> | MosaicNode<T> | null;
}

export type MosaicProps<T extends MosaicKey> =
  | MosaicControlledProps<T>
  | MosaicUncontrolledProps<T>;

function isUncontrolled<T extends MosaicKey>(
  props: MosaicProps<T>,
): props is Readonly<MosaicUncontrolledProps<T>> {
  return (props as MosaicUncontrolledProps<T>).initialValue != null;
}

export interface MosaicState<T extends MosaicKey> {
  currentNode: MosaicNode<T> | null;
  lastInitialValue: MosaicNode<T> | null;
  mosaicId: string;
}

export class MosaicWithoutDragDropContext<
  T extends MosaicKey = string,
> extends React.PureComponent<MosaicProps<T>, MosaicState<T>> {
  static defaultProps = {
    onChange: () => void 0,
    zeroStateView: <MosaicZeroState />,
    className: 'mosaic-blueprint-theme',
    blueprintNamespace: 'bp5',
  };

  static getDerivedStateFromProps(
    nextProps: Readonly<MosaicProps<MosaicKey>>,
    prevState: MosaicState<MosaicKey>,
  ): Partial<MosaicState<MosaicKey>> | null {
    if (
      nextProps.mosaicId &&
      prevState.mosaicId !== nextProps.mosaicId &&
      process.env.NODE_ENV !== 'production'
    ) {
      throw new Error(
        'Mosaic does not support updating the mosaicId after instantiation',
      );
    }

    if (
      isUncontrolled(nextProps) &&
      nextProps.initialValue !== prevState.lastInitialValue
    ) {
      return {
        lastInitialValue: convertLegacyToNary(nextProps.initialValue),
        currentNode: convertLegacyToNary(nextProps.initialValue),
      };
    }

    return null;
  }

  state: MosaicState<T> = {
    currentNode: null,
    lastInitialValue: null,
    mosaicId: this.props.mosaicId ?? uuid(),
  };

  render() {
    const { className } = this.props;

    return (
      <MosaicContext.Provider value={this.childContext as MosaicContext<any>}>
        <MosaicRootWithDragDetection className={className}>
          {this.renderTree()}
          <RootDropTargets />
        </MosaicRootWithDragDetection>
      </MosaicContext.Provider>
    );
  }

  private getRoot(): MosaicNode<T> | null {
    if (isUncontrolled(this.props)) {
      return this.state.currentNode;
    } else {
      return convertLegacyToNary(this.props.value);
    }
  }

  private updateRoot = (
    updates: MosaicUpdate<T>[],
    modifiers?: {
      suppressOnRelease?: boolean;
      suppressOnChange?: boolean;
      shouldNormalize?: boolean;
    },
  ) => {
    modifiers = {
      shouldNormalize: modifiers?.shouldNormalize ?? false,
      suppressOnRelease: modifiers?.suppressOnRelease ?? false,
      suppressOnChange: modifiers?.suppressOnChange ?? false,
    };
    const currentNode = this.getRoot() || ({} as MosaicNode<T>);

    const updatedNode = modifiers.shouldNormalize
      ? normalizeMosaicTree(updateTree(currentNode, updates))
      : updateTree(currentNode, updates);

    this.replaceRoot(
      updatedNode,
      modifiers.suppressOnRelease,
      modifiers.suppressOnChange,
    );
  };

  private replaceRoot = (
    currentNode: MosaicNode<T> | null,
    suppressOnRelease = false,
    suppressOnChange = false,
  ) => {
    if (!suppressOnChange) {
      this.props.onChange!(currentNode);
    }
    if (!suppressOnRelease && this.props.onRelease) {
      this.props.onRelease(currentNode);
    }

    if (isUncontrolled(this.props)) {
      this.setState({ currentNode });
    }
  };

  private actions: MosaicRootActions<T> = {
    updateTree: this.updateRoot,
    remove: (path: MosaicPath) => {
      if (path.length === 0) {
        this.replaceRoot(null);
      } else {
        this.updateRoot([createRemoveUpdate(this.getRoot(), path)], {
          shouldNormalize: true,
        });
      }
    },
    expand: (
      path: MosaicPath,
      percentage: number = DEFAULT_EXPAND_PERCENTAGE,
    ) => this.updateRoot([createExpandUpdate<T>(path, percentage)]),
    getRoot: () => this.getRoot()!,
    hide: (path: MosaicPath, suppressOnChange = false) => {
      this.updateRoot([createHideUpdate<T>(this.getRoot(), path)], {
        suppressOnChange,
      });
    },
    show: (path: MosaicPath, suppressOnChange = false) => {
      // To show a hidden node, we need to restore its split percentage
      // For split nodes, we restore equal percentages
      // For tab nodes, we make sure the tab is visible (already handled by hide logic)
      const root = this.getRoot();
      if (!root || path.length === 0) {
        return; // Nothing to show
      }

      const parentInfo = getParentAndChildIndex(root, path);
      if (!parentInfo) {
        return; // No parent found
      }

      const { parent } = parentInfo;

      if (isSplitNode(parent)) {
        // Restore equal percentages for all children
        const equalPercentage = 100 / parent.children.length;
        const newPercentages = Array(parent.children.length).fill(
          equalPercentage,
        );

        this.updateRoot(
          [
            {
              path: path.slice(0, -1), // Parent path
              spec: {
                splitPercentages: { $set: newPercentages },
              },
            },
          ],
          { suppressOnChange },
        );
      }
      // For tab nodes, the hide operation just changes active tab, so no need to restore
    },
    createNode: this.props.createNode,
    replaceWith: (path: MosaicPath, newNode: MosaicNode<T>) =>
      this.updateRoot([
        {
          path,
          spec: {
            $set: newNode,
          },
        },
      ]),
  };

  private readonly childContext: MosaicContext<T> = {
    mosaicActions: this.actions,
    mosaicId: this.state.mosaicId,
    blueprintNamespace: this.props.blueprintNamespace!,
  };

  private renderTree() {
    const root = this.getRoot();
    this.validateTree(root);
    if (root === null || root === undefined) {
      return this.props.zeroStateView!;
    } else {
      const { renderTile, resize } = this.props;
      return (
        <MosaicRoot
          root={root}
          renderTile={renderTile}
          renderTabToolbar={this.props.renderTabToolbar}
          renderTabToolbarControls={this.props.renderTabToolbarControls}
          renderAddTabButton={this.props.renderAddTabButton}
          resize={resize}
          renderTabTitle={this.props.renderTabTitle}
          renderTabButton={this.props.renderTabButton}
          canClose={this.props.canClose}
        />
      );
    }
  }

  private validateTree(node: MosaicNode<T> | null) {
    if (process.env.NODE_ENV !== 'production') {
      const duplicates = keys(pickBy(countBy(getLeaves(node)), (n) => n > 1));

      if (duplicates.length > 0) {
        throw new Error(
          `Duplicate IDs [${duplicates.join(', ')}] detected. Mosaic does not support leaves with the same ID`,
        );
      }
    }
  }
}

// Component to detect dragging and apply class to root
function MosaicRootWithDragDetection({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  const [{ isDragging }] = useDrop({
    accept: MosaicDragType.WINDOW,
    collect: (monitor) => ({
      isDragging:
        monitor.getItem() !== null &&
        monitor.getItemType() === MosaicDragType.WINDOW,
    }),
  });

  return (
    <div
      className={classNames(className, 'mosaic mosaic-drop-target', {
        '-dragging': isDragging,
      })}
    >
      {children}
    </div>
  );
}

export class Mosaic<T extends MosaicKey = string> extends React.PureComponent<
  MosaicProps<T>
> {
  render() {
    return (
      <DndProvider
        backend={MultiBackend}
        options={HTML5toTouch}
        context={window}
        {...(this.props.dragAndDropManager && {
          manager: this.props.dragAndDropManager,
        })}
      >
        <MosaicWithoutDragDropContext<T> {...this.props} />
      </DndProvider>
    );
  }
}

