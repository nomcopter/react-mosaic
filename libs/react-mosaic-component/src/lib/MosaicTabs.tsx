import React from 'react';
import classNames from 'classnames';
import { useDrop, useDrag, DropTargetMonitor } from 'react-dnd';
import { defer, drop as _drop, isEqual } from 'lodash-es';
import {
  MosaicKey,
  MosaicTabsNode,
  MosaicPath,
  TileRenderer,
  TabToolbarRenderer,
  MosaicDragType,
  TabTitleRenderer,
  TabButtonRenderer,
  TabCanCloseFunction,
  TabToolbarControlsRenderer,
  AddTabButtonRenderer,
  TabGroupContext,
} from './types';
import { BoundingBox, boundingBoxAsStyles } from './util/BoundingBox';
import { MosaicContext, MosaicRootActions } from './contextTypes';
import { MosaicDragItem, MosaicDropData } from './internalTypes';
import { updateTree, createDragToUpdates } from './util/mosaicUpdates';
import {
  normalizeMosaicTree,
  getNodeAtPath,
  isTabsNode,
} from './util/mosaicUtilities';
import { OptionalBlueprint } from './util/OptionalBlueprint';
import { DraggableTab } from './DraggableTab';
import { createDefaultTabsControls } from './buttons/defaultToolbarControls';
import { TabDragButton } from './buttons/TabDragButton';

export interface MosaicTabsProps<T extends MosaicKey> {
  node: MosaicTabsNode<T>;
  path: MosaicPath;
  renderTile: TileRenderer<T>;
  renderTabToolbar?: TabToolbarRenderer<T>;
  boundingBox: BoundingBox;
  renderTabTitle?: TabTitleRenderer<T>;
  renderTabButton?: TabButtonRenderer<T>;
  renderTabToolbarControls?: TabToolbarControlsRenderer<T>;
  renderAddTabButton?: AddTabButtonRenderer<T>;
  canClose?: TabCanCloseFunction<T>;
  showTabDragButton?: (path: MosaicPath) => boolean;
}

// Default tab button using DraggableTab with professional styling
const DefaultTabButton = <T extends MosaicKey>({
  tabKey,
  index,
  isActive,
  path,
  mosaicId,
  onTabClick,
  mosaicActions,
  renderTabTitle = ({ tabKey }) => `Tab ${tabKey}`,
  canClose = () => 'canClose',
  onTabClose,
  tabs,
}: {
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
}) => {
  const handleCloseClick = (event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent tab click
    onTabClose?.(tabKey, index);
  };

  // Get the close state
  const closeState = canClose(tabKey, tabs, index, path);

  return (
    <DraggableTab
      tabKey={tabKey}
      tabIndex={index}
      tabContainerPath={path}
      mosaicActions={mosaicActions}
      mosaicId={mosaicId}
    >
      {({ isDragging, connectDragSource, connectDragPreview }) => (
        <button
          className={classNames('mosaic-tab-button', {
            '-active': isActive,
            '-dragging': isDragging,
          })}
          onClick={onTabClick}
          title={`${tabKey}`}
          ref={(node) => {
            connectDragSource(node);
            connectDragPreview(node);
          }}
        >
          <span className="mosaic-tab-button-content">
            {renderTabTitle({ tabKey, path, isActive, index, mosaicId })}
          </span>
          {closeState !== 'noClose' && (
            <span
              className={classNames('mosaic-tab-close-button', {
                '-can-close': closeState === 'canClose',
                '-cannot-close': closeState === 'cannotClose',
                '-active-tab': isActive,
                '-inactive-tab': !isActive,
              })}
              onClick={closeState === 'canClose' ? handleCloseClick : undefined}
              title={
                closeState === 'canClose' ? 'Close tab' : 'Cannot close tab'
              }
            >
              <OptionalBlueprint.Icon size="empty" icon="CROSS" />
            </span>
          )}
        </button>
      )}
    </DraggableTab>
  );
};

// Drop target for tab reordering within the tab bar
const TabDropTarget = <T extends MosaicKey>({
  tabContainerPath,
  insertIndex,
}: {
  tabContainerPath: MosaicPath;
  insertIndex: number;
  mosaicActions: MosaicRootActions<T>;
  mosaicId: string;
}) => {
  const [{ isOver, canDrop, draggedMosaicId }, connectDropTarget] = useDrop({
    accept: MosaicDragType.WINDOW,
    canDrop: (item: MosaicDragItem) => {
      // Allow both tab reordering and external drops
      const isTabReorder =
        item?.isTab &&
        item?.tabContainerPath &&
        isEqual(item.tabContainerPath, tabContainerPath);
      const isExternalDrop =
        !item?.isTab || !isEqual(item.tabContainerPath, tabContainerPath);
      const shouldAccept = isTabReorder || isExternalDrop;

      return shouldAccept;
    },
    drop: (): MosaicDropData => {
      return {
        path: tabContainerPath,
        position: undefined,
        // Custom property to indicate this is a tab reorder operation
        tabReorderIndex: insertIndex,
      };
    },
    hover: () => {
      // Hover handling for tab reordering
    },
    collect: (monitor: DropTargetMonitor<MosaicDragItem>) => {
      const result = {
        isOver: monitor.isOver(),
        canDrop: monitor.canDrop(),
        draggedMosaicId: monitor.getItem()?.mosaicId,
      };

      return result;
    },
  });

  // Check if any item is being dragged
  const isDragging = draggedMosaicId != null;

  return connectDropTarget(
    <div
      className={classNames('tab-drop-target', {
        'tab-drop-target-hover': isOver,
        dragging: isDragging,
      })}
    >
      {/* Drop indicator */}
      {isOver ? (
        // Show placeholder when hovering during drag
        <div className="tab-drop-placeholder">
          <div className="tab-drop-arrow" />
          ``
        </div>
      ) : (
        // Subtle indicator when not hovering
        <div
          className={classNames('tab-drop-indicator', {
            'can-drop': canDrop,
            default: !canDrop,
          })}
        />
      )}
    </div>,
  );
};

export const MosaicTabs = <T extends MosaicKey>({
  node,
  path,
  renderTile,
  renderTabToolbar,
  boundingBox,
  renderTabTitle,
  renderTabButton,
  renderTabToolbarControls,
  renderAddTabButton,
  canClose,
  showTabDragButton,
}: MosaicTabsProps<T>) => {
  const { mosaicActions, mosaicId } = React.useContext<MosaicContext<T>>(
    MosaicContext as any,
  );
  const { tabs, activeTabIndex } = node;

  // Add drag functionality for the entire tab container
  const [, connectDragSource, connectDragPreview] = useDrag<
    MosaicDragItem,
    void,
    object
  >({
    type: MosaicDragType.WINDOW,
    item: (): MosaicDragItem => {
      // Hide the tab container when dragging starts
      // The defer is necessary as the element must be present on start for HTML DnD to not cry
      const hideTimer = defer(() => mosaicActions.hide(path));
      return {
        mosaicId,
        hideTimer,
      };
    },
    end: ({ hideTimer }, monitor) => {
      // If the hide call hasn't happened yet, cancel it
      window.clearTimeout(hideTimer);

      const ownPath = path;
      const dropResult: MosaicDropData = (monitor.getDropResult() ||
        {}) as MosaicDropData;
      const { position, path: destinationPath } = dropResult;

      // A drop is successful if we have a destination path
      const dropped = destinationPath != null;
      const isSelfDrop = dropped && isEqual(destinationPath, ownPath);

      // Check for tab container self-drop: when dragging from a tab and dropping back into the same tab container
      const isTabContainerSelfDrop =
        dropped &&
        (() => {
          const root = mosaicActions.getRoot();
          const destinationNode = getNodeAtPath(root, destinationPath);

          // If destination is the same tab container
          return (
            isTabsNode(destinationNode) && isEqual(ownPath, destinationPath)
          );
        })();

      const isChildDrop =
        dropped &&
        destinationPath.length > ownPath.length &&
        isEqual(
          ownPath,
          _drop(destinationPath, destinationPath.length - ownPath.length),
        );

      if (dropped && !isSelfDrop && !isChildDrop && !isTabContainerSelfDrop) {
        // Successful drop, let createDragToUpdates handle the logic
        const updates = createDragToUpdates(
          mosaicActions.getRoot()!,
          ownPath,
          destinationPath,
          dropResult.tabReorderIndex !== undefined
            ? {
                type: 'tab-reorder',
                insertIndex: dropResult.tabReorderIndex,
              }
            : position === undefined
              ? { type: 'tab-container' }
              : {
                  type: 'split',
                  position,
                },
        );
        mosaicActions.updateTree(updates, {
          shouldNormalize: true,
        });
      } else {
        // Canceled or invalid drop, restore the component by showing it again
        mosaicActions.show(ownPath, true); // suppressOnChange = true for drag operations
      }
    },
  });

  // Drop target for the tab content area - blocks individual window drop targets
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [, connectDropTarget] = useDrop({
    accept: MosaicDragType.WINDOW,
    canDrop: () => {
      // Never accept drops - this is just to block individual window drop targets from showing
      return false;
    },
    collect: (monitor: DropTargetMonitor<MosaicDragItem>) => ({
      isOver: monitor.isOver({ shallow: true }),
      draggedMosaicId: monitor.getItem()?.mosaicId,
    }),
  });

  // Drop target for the tab bar area to handle external drops
  const [
    { isOver: isTabBarOver, draggedMosaicId: tabBarDraggedMosaicId },
    connectTabBarDropTarget,
  ] = useDrop({
    accept: MosaicDragType.WINDOW,
    canDrop: (_item: MosaicDragItem, monitor) => {
      // Accept drops that are directly over the tab bar and not being handled by TabDropTarget
      return monitor.isOver({ shallow: true });
    },
    drop: (): MosaicDropData => {
      return {
        path,
        position: undefined, // No position needed - always add as new tab
      };
    },
    collect: (monitor: DropTargetMonitor<MosaicDragItem>) => ({
      isOver: monitor.isOver({ shallow: true }),
      draggedMosaicId: monitor.getItem()?.mosaicId,
    }),
  });

  const onTabClick = (index: number) => {
    if (index === activeTabIndex) {
      return;
    }
    mosaicActions.updateTree([
      {
        path,
        spec: { activeTabIndex: { $set: index } },
      },
    ]);
  };

  const onTabClose = (tabKey: T, index: number) => {
    // Don't close if canClose returns 'cannotClose' or 'noClose'
    const closeState = canClose
      ? canClose(tabKey, tabs, index, path)
      : 'noClose';
    if (closeState !== 'canClose') {
      return;
    }

    // If there's only one tab left, don't close it (but it should not happen)
    if (tabs.length <= 1) {
      return;
    }

    // Remove the tab from the tabs array
    const newTabs = tabs.filter((_, i) => i !== index);

    // Adjust activeTabIndex if necessary
    let newActiveTabIndex = activeTabIndex;
    if (index === activeTabIndex) {
      // If closing the active tab, set the previous tab as active, or the first tab if it was the first tab
      newActiveTabIndex = Math.max(0, index - 1);
    } else if (index < activeTabIndex) {
      // If closing a tab before the active tab, decrease the active tab index
      newActiveTabIndex = activeTabIndex - 1;
    }

    // Update the tree
    const updates = [
      {
        path,
        spec: {
          tabs: { $set: newTabs },
          activeTabIndex: { $set: newActiveTabIndex },
        },
      },
    ];

    let newTree = mosaicActions.getRoot();
    if (!newTree) return;

    updates.forEach((update) => {
      newTree = updateTree(newTree!, [update]);
    });

    const normalizedTree = normalizeMosaicTree(newTree);
    mosaicActions.replaceWith([], normalizedTree!);
  };

  const addTab = () => {
    if (mosaicActions.createNode == null) {
      throw new Error(
        'Operation invalid unless `createNode` is defined on Mosaic',
      );
    }
    Promise.resolve(mosaicActions.createNode()).then((newNode) => {
      if (typeof newNode !== 'string' && typeof newNode !== 'number') {
        console.error(
          'createNode() for adding a tab should return a MosaicKey (string or number).',
        );
        return;
      }

      // Update tree and normalize
      const updates = [
        {
          path, // The path to this tabs node
          spec: {
            tabs: { $push: [newNode] },
            // Set the new tab as active. Its index is the original length of the array.
            activeTabIndex: { $set: tabs.length },
          },
        },
      ];

      let newTree = mosaicActions.getRoot();
      if (!newTree) return;

      updates.forEach((update) => {
        newTree = updateTree(newTree!, [update]);
      });

      const normalizedTree = normalizeMosaicTree(newTree);
      mosaicActions.replaceWith([], normalizedTree!);
    });
  };

  const renderDefaultToolbar = () => {
    const isDragAllowed = path.length > 0;
    const tabGroupCtx: TabGroupContext<T> = {
      tabs,
      activeTabIndex,
      path,
      mosaicId,
    };

    const showDragButton =
      isDragAllowed && (showTabDragButton ? showTabDragButton(path) : true);

    // When the consumer provides custom controls we render the drag button
    // as a library-owned sibling before them. With the default controls the
    // drag button lives inside the cluster (via createDefaultTabsControls).
    const dragButton =
      showDragButton && renderTabToolbarControls !== undefined ? (
        <TabDragButton connectDragSource={connectDragSource} />
      ) : null;

    const tabToolbarControls = renderTabToolbarControls
      ? renderTabToolbarControls(tabGroupCtx)
      : createDefaultTabsControls(
          path,
          showDragButton ? connectDragSource : undefined,
        );

    const addButton = renderAddTabButton ? (
      renderAddTabButton(tabGroupCtx)
    ) : (
      <button
        className="mosaic-tab-add-button"
        onClick={addTab}
        aria-label="Add new tab"
        title="Add new tab"
      >
        +
      </button>
    );

    return connectTabBarDropTarget(
      <div
        className={classNames('mosaic-tab-bar', {
          'tab-bar-drop-target-hover':
            isTabBarOver && tabBarDraggedMosaicId === mosaicId,
          draggable: isDragAllowed,
        })}
      >
        {/* Scrollable tabs section */}
        <div className="mosaic-tab-bar-tabs">
          {/* Drop target at the beginning */}
          <TabDropTarget
            tabContainerPath={path}
            insertIndex={0}
            mosaicActions={mosaicActions}
            mosaicId={mosaicId}
          />

          {tabs.map((tabKey, index) => {
            const TabButtonComponent = renderTabButton || DefaultTabButton;
            return (
              <React.Fragment key={tabKey}>
                <TabButtonComponent
                  tabKey={tabKey}
                  index={index}
                  isActive={index === activeTabIndex}
                  path={path}
                  mosaicId={mosaicId}
                  onTabClick={() => onTabClick(index)}
                  mosaicActions={mosaicActions}
                  renderTabTitle={renderTabTitle}
                  canClose={canClose}
                  onTabClose={onTabClose}
                  tabs={tabs}
                />

                {/* Drop target after each tab */}
                <TabDropTarget
                  tabContainerPath={path}
                  insertIndex={index + 1}
                  mosaicActions={mosaicActions}
                  mosaicId={mosaicId}
                />
              </React.Fragment>
            );
          })}
        </div>

        {/* Always-visible controls: add, drag (library-owned), toolbar */}
        <div className="mosaic-tab-bar-controls">
          {addButton}
          {dragButton}

          <div className="mosaic-tab-toolbar-controls">
            {tabToolbarControls}
          </div>
        </div>
      </div>,
    );
  };

  const activeTabKey = tabs[activeTabIndex];
  const tilePath = path.concat(activeTabIndex);

  // Drag preview for the entire tab container
  const renderPreview = () => (
    <div className="mosaic-preview">
      <div className="mosaic-tab-bar">
        <div className="mosaic-tab-bar-tabs">
          {tabs.map((tabKey, index) => (
            <button
              key={tabKey}
              className={classNames('mosaic-tab-button', {
                '-active': index === activeTabIndex,
              })}
            >
              <span className="mosaic-tab-button-content">
                {renderTabTitle
                  ? renderTabTitle({
                      tabKey,
                      path,
                      isActive: index === activeTabIndex,
                      index,
                      mosaicId,
                    })
                  : `Tab ${tabKey}`}
              </span>
            </button>
          ))}
        </div>
      </div>
      <div className="mosaic-window-body">
        <h4>Tab Container</h4>
        <OptionalBlueprint.Icon
          className="default-preview-icon"
          size="large"
          icon="APPLICATION"
        />
      </div>
    </div>
  );

  return (
    // This is the container for the entire tab group.
    // Its position and size are determined ONLY by the boundingBox.
    <div
      className="mosaic-tabs-container"
      style={boundingBoxAsStyles(boundingBox)}
    >
      {/* Use the custom toolbar renderer if provided, otherwise use our default */}
      {renderTabToolbar
        ? renderTabToolbar({
            tabs,
            activeTabIndex,
            path,
            DraggableTab: (props) => (
              <DraggableTab
                key={props.tabKey}
                {...props}
                tabContainerPath={path}
                mosaicActions={mosaicActions}
                mosaicId={mosaicId}
              />
            ),
          })
        : renderDefaultToolbar()}

      {connectDropTarget(
        <div className="mosaic-tile">{renderTile(activeTabKey, tilePath)}</div>,
      )}

      {/* Drag preview for the entire tab container */}
      {connectDragPreview(renderPreview())}
    </div>
  );
};
