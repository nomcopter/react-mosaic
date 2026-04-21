import classNames from 'classnames';
import { defer, drop, isEqual, values } from 'lodash-es';
import React, { useContext, ReactElement, createRef } from 'react';
import {
  ConnectDragPreview,
  ConnectDragSource,
  ConnectDropTarget,
  DropTargetMonitor,
  useDrag,
  useDrop,
} from 'react-dnd';

import {
  DEFAULT_PANEL_CONTROLS_IN_TABS,
  DEFAULT_PANEL_CONTROLS_WITHOUT_CREATION,
  DEFAULT_PANEL_CONTROLS_WITH_CREATION,
} from './buttons/defaultToolbarControls';
import { Separator } from './buttons/Separator';
import { MosaicContext, MosaicWindowContext } from './contextTypes';
import {
  MosaicDragItem,
  MosaicDropData,
  MosaicDropTargetPosition,
} from './internalTypes';
import { MosaicDropTarget } from './MosaicDropTarget';
import {
  CreateNode,
  MosaicDirection,
  MosaicDragType,
  MosaicKey,
  MosaicNode,
  MosaicPath,
  MosaicSplitNode,
} from './types';
import { createDragToUpdates } from './util/mosaicUpdates';
import {
  getNodeAtPath,
  getParentNode,
  isTabsNode,
} from './util/mosaicUtilities';
import { OptionalBlueprint } from './util/OptionalBlueprint';

export interface MosaicWindowProps<T extends MosaicKey> {
  title: string;
  path: MosaicPath;
  children?: React.ReactNode;
  className?: string;
  toolbarControls?: React.ReactNode;
  additionalControls?: React.ReactNode;
  additionalControlButtonText?: string;
  onAdditionalControlsToggle?: (toggle: boolean) => void;
  createNode?: CreateNode<T>;
  disableAdditionalControlsOverlay?: boolean;
  draggable?: boolean;
  renderPreview?: (props: MosaicWindowProps<T>) => ReactElement;
  renderToolbar?:
  | ((
    props: MosaicWindowProps<T>,
    draggable: boolean | undefined,
  ) => ReactElement)
  | null;
  onDragStart?: () => void;
  onDragEnd?: (type: 'drop' | 'reset') => void;
}

export interface InternalDragSourceProps {
  connectDragSource: ConnectDragSource;
  connectDragPreview: ConnectDragPreview;
}

export interface InternalDropTargetProps {
  connectDropTarget: ConnectDropTarget;
  isOver: boolean;
  draggedMosaicId: string | undefined;
  isDragging?: boolean;
}

export type InternalMosaicWindowProps<T extends MosaicKey> =
  MosaicWindowProps<T> & InternalDropTargetProps & InternalDragSourceProps;

export interface InternalMosaicWindowState {
  additionalControlsOpen: boolean;
}

export class InternalMosaicWindow<T extends MosaicKey> extends React.Component<
  InternalMosaicWindowProps<T>,
  InternalMosaicWindowState
> {
  static defaultProps: Partial<InternalMosaicWindowProps<any>> = {
    additionalControlButtonText: 'More',
    draggable: true,
    renderPreview: ({ title }) => (
      <div className="mosaic-preview">
        <div className="mosaic-window-toolbar">
          <div className="mosaic-window-title">{title}</div>
        </div>
        <div className="mosaic-window-body">
          <h4>{title}</h4>
          <OptionalBlueprint.Icon
            className="default-preview-icon"
            size="large"
            icon="APPLICATION"
          />
        </div>
      </div>
    ),
    renderToolbar: null,
  };
  static contextType = MosaicContext;
  declare context: React.ContextType<typeof MosaicContext>;

  state: InternalMosaicWindowState = {
    additionalControlsOpen: false,
  };

  private rootElement = createRef<HTMLDivElement>();

  render() {
    const {
      className,
      isOver,
      renderPreview,
      additionalControls,
      connectDropTarget,
      connectDragPreview,
      draggedMosaicId,
      disableAdditionalControlsOverlay,
    } = this.props;

    // Check if this window is inside a tab container
    const root = this.context.mosaicActions.getRoot();
    const parentNode = getParentNode(root, this.props.path);
    const isInTabContainer = isTabsNode(parentNode);

    return (
      <MosaicWindowContext.Provider value={this.childContext}>
        <div
          className={classNames(
            'mosaic-window',
            'mosaic-drop-target',
            className,
            {
              'drop-target-hover':
                isOver && draggedMosaicId === this.context.mosaicId,
              'additional-controls-open': this.state.additionalControlsOpen,
            },
          )}
          ref={node => {
            this.rootElement.current = node;
            connectDropTarget(node);
          }}
        >
          {this.renderToolbar()}
          <div className="mosaic-window-body">{this.props.children}</div>
          {!disableAdditionalControlsOverlay && (
            <div
              className="mosaic-window-body-overlay"
              onClick={() => {
                this.setAdditionalControlsOpen(false);
              }}
            />
          )}
          <div className="mosaic-window-additional-actions-bar">
            {additionalControls}
          </div>
          {connectDragPreview(renderPreview!(this.props))}
          {/* Only render individual drop targets if NOT inside a tab container */}
          {!isInTabContainer && (
            <div className={classNames('drop-target-container', {})}>
              {values<MosaicDropTargetPosition>(MosaicDropTargetPosition).map(
                this.renderDropTarget,
              )}
            </div>
          )}
        </div>
      </MosaicWindowContext.Provider>
    );
  }

  private getToolbarControls() {
    const { toolbarControls, createNode, path } = this.props;

    if (toolbarControls) {
      return toolbarControls; // User is in full control
    }

    const root = this.context.mosaicActions.getRoot();
    const parentNode = getParentNode(root, path);

    if (isTabsNode(parentNode)) {
      return DEFAULT_PANEL_CONTROLS_IN_TABS;
    } else if (createNode) {
      return DEFAULT_PANEL_CONTROLS_WITH_CREATION;
    } else {
      return DEFAULT_PANEL_CONTROLS_WITHOUT_CREATION;
    }
  }

  private renderToolbar() {
    const {
      title,
      draggable,
      additionalControls,
      additionalControlButtonText,
      path,
      renderToolbar,
    } = this.props;
    const { additionalControlsOpen } = this.state;
    const toolbarControls = this.getToolbarControls();
    const root = this.context.mosaicActions.getRoot();
    const parentNode = getParentNode(root, path);
    const isDragAllowed =
      draggable && path.length > 0 && !isTabsNode(parentNode);
    const connectIfDraggable = isDragAllowed
      ? this.props.connectDragSource
      : (el: React.ReactElement) => el;

    if (renderToolbar) {
      const connectedToolbar = connectIfDraggable(
        renderToolbar(this.props, draggable),
      ) as React.ReactElement<any>;
      return (
        <div
          className={classNames('mosaic-window-toolbar', {
            draggable: isDragAllowed,
          })}
        >
          {connectedToolbar}
        </div>
      );
    }

    const titleDiv = connectIfDraggable(
      <div title={title} className="mosaic-window-title">
        {title}
      </div>,
    );

    const hasAdditionalControls = !!additionalControls;

    return (
      <div
        className={classNames('mosaic-window-toolbar', {
          draggable: isDragAllowed,
        })}
      >
        {titleDiv}
        <div
          className={classNames(
            'mosaic-window-controls',
            OptionalBlueprint.getClasses('BUTTON_GROUP'),
          )}
        >
          {hasAdditionalControls && (
            <button
              onClick={() =>
                this.setAdditionalControlsOpen(!additionalControlsOpen)
              }
              className={classNames(
                OptionalBlueprint.getClasses(
                  this.context.blueprintNamespace,
                  'BUTTON',
                  'MINIMAL',
                ),
                OptionalBlueprint.getIconClass(
                  this.context.blueprintNamespace,
                  'MORE',
                ),
                {
                  [OptionalBlueprint.getClasses(
                    this.context.blueprintNamespace,
                    'ACTIVE',
                  )]: additionalControlsOpen,
                },
              )}
            >
              <span className="control-text">
                {additionalControlButtonText!}
              </span>
            </button>
          )}
          {hasAdditionalControls && <Separator />}
          {toolbarControls}
        </div>
      </div>
    );
  }

  private renderDropTarget = (position: MosaicDropTargetPosition) => {
    const { path } = this.props;
    return <MosaicDropTarget position={position} path={path} key={position} />;
  };

  private checkCreateNode() {
    if (this.props.createNode == null) {
      throw new Error('Operation invalid unless `createNode` is defined');
    }
  }

  private split = (...args: any[]) => {
    this.checkCreateNode();
    const { path } = this.props;
    const { mosaicActions } = this.context;
    const root = mosaicActions.getRoot() as MosaicNode<T> | null;
    const parentNode = getParentNode(root, path);

    if (isTabsNode(parentNode)) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn(
          'Mosaic: Cannot split a panel that is already inside a tab group.',
        );
      }
      return Promise.resolve(); // Fail gracefully by doing nothing.
    }

    const direction: MosaicDirection =
      this.rootElement.current &&
        this.rootElement.current.offsetWidth >
        this.rootElement.current.offsetHeight
        ? 'row'
        : 'column';

    const currentNode = getNodeAtPath(root, path);
    if (!currentNode) {
      throw new Error('Current node could not be found.');
    }

    return Promise.resolve(mosaicActions.createNode!(...args)).then(
      (second) => {
        const newSplitNode: MosaicSplitNode<T> = {
          type: 'split',
          direction,
          children: [currentNode, second as MosaicNode<T>],
          splitPercentages: [50, 50],
        };
        mosaicActions.replaceWith(path, newSplitNode);
      },
    );
  };

  private addTab = (...args: any[]) => {
    this.checkCreateNode();
    const { path } = this.props;
    const { mosaicActions } = this.context;
    const root = mosaicActions.getRoot() as MosaicNode<T> | null;
    // If this window already lives inside a tab group, target the containing
    // group so the new tab is appended there. Otherwise the root action will
    // convert this leaf into a 2-tab group.
    const parentNode = getParentNode(root, path);
    const target = isTabsNode(parentNode) ? path.slice(0, -1) : path;
    return mosaicActions.addTab(target, ...args);
  };

  private getRoot = () => {
    const { mosaicActions } = this.context;
    return mosaicActions.getRoot();
  };

  private swap = (...args: any[]) => {
    this.checkCreateNode();
    const { mosaicActions } = this.context;
    const { path, createNode } = this.props;
    return Promise.resolve(createNode!(...args)).then((node) =>
      mosaicActions.replaceWith(path, node),
    );
  };

  private setAdditionalControlsOpen = (
    additionalControlsOpenOption: boolean | 'toggle',
  ) => {
    const additionalControlsOpen =
      additionalControlsOpenOption === 'toggle'
        ? !this.state.additionalControlsOpen
        : additionalControlsOpenOption;
    this.setState({ additionalControlsOpen });
    this.props.onAdditionalControlsToggle?.(additionalControlsOpen);
  };

  private getPath = () => this.props.path;

  private connectDragSource = (connectedElements: React.ReactElement<any>) => {
    const { connectDragSource } = this.props;
    return connectDragSource(connectedElements);
  };

  private readonly childContext: MosaicWindowContext = {
    // @ts-expect-error we need it
    blueprintNamespace: this.context.blueprintNamespace,
    mosaicWindowActions: {
      split: this.split,
      addTab: this.addTab,
      getRoot: this.getRoot,
      replaceWithNew: this.swap,
      setAdditionalControlsOpen: this.setAdditionalControlsOpen,
      getPath: this.getPath,
      connectDragSource: this.connectDragSource,
    },
  };
}

function ConnectedInternalMosaicWindow<T extends MosaicKey = string>(
  props: InternalMosaicWindowProps<T>,
) {
  const { mosaicActions, mosaicId } = useContext(MosaicContext);

  const [, connectDragSource, connectDragPreview] = useDrag<
    MosaicDragItem,
    void,
    object
  >({
    type: MosaicDragType.WINDOW,
    item: (): MosaicDragItem => {
      if (props.onDragStart) {
        props.onDragStart();
      }
      // TODO: Actually just delete instead of hiding
      // The defer is necessary as the element must be present on start for HTML DnD to not cry
      const hideTimer = defer(() => mosaicActions.hide(props.path));
      return {
        mosaicId,
        hideTimer,
      };
    },
    end: ({ hideTimer }, monitor) => {
      // If the hide call hasn't happened yet, cancel it
      window.clearTimeout(hideTimer);

      const ownPath = props.path;
      const dropResult: MosaicDropData = (monitor.getDropResult() ||
        {}) as MosaicDropData;
      const { position, path: destinationPath } = dropResult;

      // A drop is successful if we have a destination path
      // Position can be undefined for tab container drops
      const dropped = destinationPath != null;
      const isSelfDrop = dropped && isEqual(destinationPath, ownPath);

      // Check for tab container self-drop: when dragging from a tab and dropping back into the same tab container
      const isTabContainerSelfDrop =
        dropped &&
        (() => {
          const root = mosaicActions.getRoot();
          const ownParentPath = ownPath.slice(0, -1);
          const ownParentNode = getNodeAtPath(root, ownParentPath);
          const destinationNode = getNodeAtPath(root, destinationPath);

          // If the source is from a tab container and destination is the same tab container
          return (
            isTabsNode(ownParentNode) &&
            isTabsNode(destinationNode) &&
            isEqual(ownParentPath, destinationPath)
          );
        })();

      const isChildDrop =
        dropped &&
        destinationPath.length > ownPath.length &&
        isEqual(
          ownPath,
          drop(destinationPath, destinationPath.length - ownPath.length),
        );

      if (dropped && !isSelfDrop && !isChildDrop && !isTabContainerSelfDrop) {
        // Successful drop, let createDragToUpdates and the reducer handle the logic.
        // This handles all cases: split, creating a new tab group, or adding to an existing one.
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
        if (props.onDragEnd) {
          props.onDragEnd('drop');
        }
      } else {
        // Canceled or invalid drop, restore the original component by showing it again.
        mosaicActions.show(ownPath, true); // suppressOnChange = true for drag operations
        if (props.onDragEnd) {
          props.onDragEnd('reset');
        }
      }
    },
  });

  const [{ isOver, draggedMosaicId }, connectDropTarget] = useDrop({
    accept: MosaicDragType.WINDOW,
    collect: (monitor: DropTargetMonitor<MosaicDragItem>) => ({
      isOver: monitor.isOver(),
      draggedMosaicId: monitor.getItem()?.mosaicId,
    }),
  });
  return (
    <InternalMosaicWindow
      {...props}
      connectDragPreview={connectDragPreview}
      connectDragSource={connectDragSource}
      connectDropTarget={connectDropTarget}
      isOver={isOver}
      draggedMosaicId={draggedMosaicId}
    />
  );
}

export class MosaicWindow<
  T extends MosaicKey = string,
> extends React.PureComponent<MosaicWindowProps<T>> {
  render() {
    return (
      <ConnectedInternalMosaicWindow<T>
        {...(this.props as InternalMosaicWindowProps<T>)}
      />
    );
  }
}

