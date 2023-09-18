import classNames from 'classnames';
import defer from 'lodash/defer';
import dropRight from 'lodash/dropRight';
import isEmpty from 'lodash/isEmpty';
import isEqual from 'lodash/isEqual';
import values from 'lodash/values';
import React, { useContext } from 'react';
import {
  ConnectDragPreview,
  ConnectDragSource,
  ConnectDropTarget,
  DropTargetMonitor,
  useDrag,
  useDrop,
} from 'react-dnd';

import { DEFAULT_CONTROLS_WITHOUT_CREATION, DEFAULT_CONTROLS_WITH_CREATION } from './buttons/defaultToolbarControls';
import { Separator } from './buttons/Separator';
import { MosaicContext, MosaicWindowContext } from './contextTypes';
import { MosaicDragItem, MosaicDropData, MosaicDropTargetPosition } from './internalTypes';
import { MosaicDropTarget } from './MosaicDropTarget';
import { CreateNode, MosaicBranch, MosaicDirection, MosaicDragType, MosaicKey } from './types';
import { createDragToUpdates } from './util/mosaicUpdates';
import { getAndAssertNodeAtPathExists } from './util/mosaicUtilities';
import { OptionalBlueprint } from './util/OptionalBlueprint';

export interface MosaicWindowProps<T extends MosaicKey> {
  title: string;
  path: MosaicBranch[];
  children?: React.ReactNode;
  className?: string;
  toolbarControls?: React.ReactNode;
  additionalControls?: React.ReactNode;
  additionalControlButtonText?: string;
  onAdditionalControlsToggle?: (toggle: boolean) => void;
  disableAdditionalControlsOverlay?: boolean;
  draggable?: boolean;
  createNode?: CreateNode<T>;
  renderPreview?: (props: MosaicWindowProps<T>) => JSX.Element;
  renderToolbar?: ((props: MosaicWindowProps<T>, draggable: boolean | undefined) => JSX.Element) | null;
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
}

export type InternalMosaicWindowProps<T extends MosaicKey> = MosaicWindowProps<T> &
  InternalDropTargetProps &
  InternalDragSourceProps;

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
          <OptionalBlueprint.Icon className="default-preview-icon" size="large" icon="APPLICATION" />
        </div>
      </div>
    ),
    renderToolbar: null,
  };
  static contextType = MosaicContext;
  context!: MosaicContext<T>;

  state: InternalMosaicWindowState = {
    additionalControlsOpen: false,
  };

  private rootElement: HTMLElement | null = null;

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

    return (
      <MosaicWindowContext.Provider value={this.childContext}>
        {connectDropTarget(
          <div
            className={classNames('mosaic-window mosaic-drop-target', className, {
              'drop-target-hover': isOver && draggedMosaicId === this.context.mosaicId,
              'additional-controls-open': this.state.additionalControlsOpen,
            })}
            ref={(element) => (this.rootElement = element)}
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
            <div className="mosaic-window-additional-actions-bar">{additionalControls}</div>
            {connectDragPreview(renderPreview!(this.props))}
            <div className="drop-target-container">
              {values<MosaicDropTargetPosition>(MosaicDropTargetPosition).map(this.renderDropTarget)}
            </div>
          </div>,
        )}
      </MosaicWindowContext.Provider>
    );
  }

  private getToolbarControls() {
    const { toolbarControls, createNode } = this.props;
    if (toolbarControls) {
      return toolbarControls;
    } else if (createNode) {
      return DEFAULT_CONTROLS_WITH_CREATION;
    } else {
      return DEFAULT_CONTROLS_WITHOUT_CREATION;
    }
  }

  private renderToolbar() {
    const { title, draggable, additionalControls, additionalControlButtonText, path, renderToolbar } = this.props;
    const { additionalControlsOpen } = this.state;
    const toolbarControls = this.getToolbarControls();
    const draggableAndNotRoot = draggable && path.length > 0;
    const connectIfDraggable = draggableAndNotRoot ? this.props.connectDragSource : (el: React.ReactElement) => el;

    if (renderToolbar) {
      const connectedToolbar = connectIfDraggable(renderToolbar(this.props, draggable)) as React.ReactElement<any>;
      return (
        <div className={classNames('mosaic-window-toolbar', { draggable: draggableAndNotRoot })}>
          {connectedToolbar}
        </div>
      );
    }

    const titleDiv = connectIfDraggable(
      <div title={title} className="mosaic-window-title">
        {title}
      </div>,
    )!;

    const hasAdditionalControls = !isEmpty(additionalControls);

    return (
      <div className={classNames('mosaic-window-toolbar', { draggable: draggableAndNotRoot })}>
        {titleDiv}
        <div className={classNames('mosaic-window-controls', OptionalBlueprint.getClasses('BUTTON_GROUP'))}>
          {hasAdditionalControls && (
            <button
              onClick={() => this.setAdditionalControlsOpen(!additionalControlsOpen)}
              className={classNames(
                OptionalBlueprint.getClasses(this.context.blueprintNamespace, 'BUTTON', 'MINIMAL'),
                OptionalBlueprint.getIconClass(this.context.blueprintNamespace, 'MORE'),
                {
                  [OptionalBlueprint.getClasses(this.context.blueprintNamespace, 'ACTIVE')]: additionalControlsOpen,
                },
              )}
            >
              <span className="control-text">{additionalControlButtonText!}</span>
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
    const { createNode, path } = this.props;
    const { mosaicActions } = this.context;
    const root = mosaicActions.getRoot();

    const direction: MosaicDirection =
      this.rootElement!.offsetWidth > this.rootElement!.offsetHeight ? 'row' : 'column';

    return Promise.resolve(createNode!(...args)).then((second) =>
      mosaicActions.replaceWith(path, {
        direction,
        second,
        first: getAndAssertNodeAtPathExists(root, path),
      }),
    );
  };

  private swap = (...args: any[]) => {
    this.checkCreateNode();
    const { mosaicActions } = this.context;
    const { createNode, path } = this.props;
    return Promise.resolve(createNode!(...args)).then((node) => mosaicActions.replaceWith(path, node));
  };

  private setAdditionalControlsOpen = (additionalControlsOpenOption: boolean | 'toggle') => {
    const additionalControlsOpen =
      additionalControlsOpenOption === 'toggle' ? !this.state.additionalControlsOpen : additionalControlsOpenOption;
    this.setState({ additionalControlsOpen });
    this.props.onAdditionalControlsToggle?.(additionalControlsOpen);
  };

  private getPath = () => this.props.path;

  private connectDragSource = (connectedElements: React.ReactElement<any>) => {
    const { connectDragSource } = this.props;
    return connectDragSource(connectedElements);
  };

  private readonly childContext: MosaicWindowContext = {
    blueprintNamespace: this.context.blueprintNamespace,
    mosaicWindowActions: {
      split: this.split,
      replaceWithNew: this.swap,
      setAdditionalControlsOpen: this.setAdditionalControlsOpen,
      getPath: this.getPath,
      connectDragSource: this.connectDragSource,
    },
  };
}

function ConnectedInternalMosaicWindow<T extends MosaicKey = string>(props: InternalMosaicWindowProps<T>) {
  const { mosaicActions, mosaicId } = useContext(MosaicContext);

  const [, connectDragSource, connectDragPreview] = useDrag<MosaicDragItem>({
    type: MosaicDragType.WINDOW,
    item: (_monitor): MosaicDragItem | null => {
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
    end: (item, monitor) => {
      const { hideTimer } = item;
      // If the hide call hasn't happened yet, cancel it
      window.clearTimeout(hideTimer);

      const ownPath = props.path;
      const dropResult: MosaicDropData = (monitor.getDropResult() || {}) as MosaicDropData;
      const { position, path: destinationPath } = dropResult;
      if (position != null && destinationPath != null && !isEqual(destinationPath, ownPath)) {
        mosaicActions.updateTree(createDragToUpdates(mosaicActions.getRoot()!, ownPath, destinationPath, position));
        if (props.onDragEnd) {
          props.onDragEnd('drop');
        }
      } else {
        // TODO: restore node from captured state
        mosaicActions.updateTree([
          {
            path: dropRight(ownPath),
            spec: {
              splitPercentage: {
                $set: undefined,
              },
            },
          },
        ]);
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

export class MosaicWindow<T extends MosaicKey = string> extends React.PureComponent<MosaicWindowProps<T>> {
  render() {
    return <ConnectedInternalMosaicWindow<T> {...(this.props as InternalMosaicWindowProps<T>)} />;
  }
}
