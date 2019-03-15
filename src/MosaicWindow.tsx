import classNames from 'classnames';
import defer from 'lodash/defer';
import dropRight from 'lodash/dropRight';
import isEmpty from 'lodash/isEmpty';
import isEqual from 'lodash/isEqual';
import values from 'lodash/values';
import React from 'react';
import {
  ConnectDragPreview,
  ConnectDragSource,
  ConnectDropTarget,
  DragSource,
  DragSourceMonitor,
  DropTarget,
} from 'react-dnd';

import { DEFAULT_CONTROLS_WITH_CREATION, DEFAULT_CONTROLS_WITHOUT_CREATION } from './buttons/defaultToolbarControls';
import { Separator } from './buttons/Separator';
import {
  ModernMosaicWindowContext,
  MosaicContext,
  MosaicWindowActionsPropType,
  MosaicWindowContext,
} from './contextTypes';
import { MosaicDragItem, MosaicDropData, MosaicDropTargetPosition } from './internalTypes';
import { MosaicDropTarget } from './MosaicDropTarget';
import { CreateNode, MosaicBranch, MosaicDirection, MosaicDragType, MosaicKey } from './types';
import { createDragToUpdates } from './util/mosaicUpdates';
import { getAndAssertNodeAtPathExists } from './util/mosaicUtilities';
import { OptionalBlueprint } from './util/OptionalBlueprint';

export interface MosaicWindowProps<T extends MosaicKey> {
  title: string;
  path: MosaicBranch[];
  className?: string;
  toolbarControls?: React.ReactNode;
  additionalControls?: React.ReactNode;
  additionalControlButtonText?: string;
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
          <OptionalBlueprint.Icon iconSize={72} icon="application" />
        </div>
      </div>
    ),
    renderToolbar: null,
  };

  static contextTypes = MosaicContext;

  static childContextTypes = {
    mosaicWindowActions: MosaicWindowActionsPropType,
  };

  state: InternalMosaicWindowState = {
    additionalControlsOpen: false,
  };
  context!: MosaicContext<T>;

  private rootElement: HTMLElement | null = null;

  getChildContext(): Partial<MosaicWindowContext<T>> {
    return this.childContext;
  }

  render() {
    const {
      className,
      isOver,
      renderPreview,
      additionalControls,
      connectDropTarget,
      connectDragPreview,
      draggedMosaicId,
    } = this.props;

    return (
      <ModernMosaicWindowContext.Provider value={this.childContext}>
        {connectDropTarget(
          <div
            className={classNames('mosaic-window mosaic-drop-target', className, {
              'drop-target-hover': isOver && draggedMosaicId === this.context.mosaicId,
              'additional-controls-open': this.state.additionalControlsOpen,
            })}
            ref={(element) => (this.rootElement = element)}
          >
            {this.renderToolbar()}
            <div className="mosaic-window-body">{this.props.children!}</div>
            <div className="mosaic-window-body-overlay" onClick={() => this.setAdditionalControlsOpen(false)} />
            <div className="mosaic-window-additional-actions-bar">{additionalControls}</div>
            {connectDragPreview(renderPreview!(this.props))}
            <div className="drop-target-container">
              {values<MosaicDropTargetPosition>(MosaicDropTargetPosition).map(this.renderDropTarget)}
            </div>
          </div>,
        )}
      </ModernMosaicWindowContext.Provider>
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
    const {
      title,
      draggable,
      additionalControls,
      additionalControlButtonText,
      connectDragSource,
      path,
      renderToolbar,
    } = this.props;
    const { additionalControlsOpen } = this.state;
    const toolbarControls = this.getToolbarControls();
    const draggableAndNotRoot = draggable && path.length > 0;

    if (renderToolbar) {
      const connectedToolbar = connectDragSource(renderToolbar(this.props, draggable)) as React.ReactElement<any>;
      return (
        <div className={classNames('mosaic-window-toolbar', { draggable: draggableAndNotRoot })}>
          {connectedToolbar}
        </div>
      );
    }

    let titleDiv: React.ReactElement<any> = (
      <div title={title} className="mosaic-window-title">
        {title}
      </div>
    );

    if (draggableAndNotRoot) {
      titleDiv = connectDragSource(titleDiv) as React.ReactElement<any>;
    }

    const hasAdditionalControls = !isEmpty(additionalControls);

    return (
      <div className={classNames('mosaic-window-toolbar', { draggable: draggableAndNotRoot })}>
        {titleDiv}
        <div className={classNames('mosaic-window-controls', OptionalBlueprint.getClasses('BUTTON_GROUP'))}>
          {hasAdditionalControls && (
            <button
              onClick={() => this.setAdditionalControlsOpen(!additionalControlsOpen)}
              className={classNames(
                OptionalBlueprint.getClasses('BUTTON', 'MINIMAL'),
                OptionalBlueprint.getIconClass('MORE'),
                {
                  [OptionalBlueprint.getClasses('ACTIVE')]: additionalControlsOpen,
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

  private setAdditionalControlsOpen = (additionalControlsOpen: boolean) => {
    this.setState({ additionalControlsOpen });
  };

  private getPath = () => this.props.path;

  private connectDragSource = (connectedElements: React.ReactElement<any>) => {
    const { connectDragSource } = this.props;
    return connectDragSource(connectedElements);
  };

  private readonly childContext: ModernMosaicWindowContext = {
    mosaicWindowActions: {
      split: this.split,
      replaceWithNew: this.swap,
      setAdditionalControlsOpen: this.setAdditionalControlsOpen,
      getPath: this.getPath,
      connectDragSource: this.connectDragSource,
    },
  };
}

const dragSource = {
  beginDrag: (
    props: InternalMosaicWindowProps<any>,
    _monitor: DragSourceMonitor,
    component: InternalMosaicWindow<any>,
  ): MosaicDragItem => {
    if (props.onDragStart) {
      props.onDragStart();
    }
    // TODO: Actually just delete instead of hiding
    // The defer is necessary as the element must be present on start for HTML DnD to not cry
    const hideTimer = defer(() => component.context.mosaicActions.hide(component.props.path));
    return {
      mosaicId: component.context.mosaicId,
      hideTimer,
    };
  },
  endDrag: (
    props: InternalMosaicWindowProps<any>,
    monitor: DragSourceMonitor,
    component: InternalMosaicWindow<any>,
  ) => {
    const { hideTimer } = monitor.getItem() as MosaicDragItem;
    // If the hide call hasn't happened yet, cancel it
    window.clearTimeout(hideTimer);

    const ownPath = component.props.path;
    const dropResult: MosaicDropData = (monitor.getDropResult() || {}) as MosaicDropData;
    const { mosaicActions } = component.context;
    const { position, path: destinationPath } = dropResult;
    if (position != null && destinationPath != null && !isEqual(destinationPath, ownPath)) {
      mosaicActions.updateTree(createDragToUpdates(mosaicActions.getRoot(), ownPath, destinationPath, position));
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
              $set: null,
            },
          },
        },
      ]);
      if (props.onDragEnd) {
        props.onDragEnd('reset');
      }
    }
  },
};

const dropTarget = {};

// Each step exported here just to keep react-hot-loader happy
export const SourceConnectedInternalMosaicWindow = DragSource(
  MosaicDragType.WINDOW,
  dragSource,
  (connect, _monitor): InternalDragSourceProps => ({
    connectDragSource: connect.dragSource(),
    connectDragPreview: connect.dragPreview(),
  }),
)(InternalMosaicWindow);

export const SourceDropConnectedInternalMosaicWindow = DropTarget(
  MosaicDragType.WINDOW,
  dropTarget,
  (connect, monitor): InternalDropTargetProps => ({
    connectDropTarget: connect.dropTarget(),
    isOver: monitor.isOver(),
    draggedMosaicId: ((monitor.getItem() || {}) as MosaicDragItem).mosaicId,
  }),
)(SourceConnectedInternalMosaicWindow as any);

export class MosaicWindow<T extends MosaicKey = string> extends React.PureComponent<MosaicWindowProps<T>> {
  static ofType<T extends MosaicKey>() {
    return MosaicWindow as new (props: MosaicWindowProps<T>, context?: any) => MosaicWindow<T>;
  }

  render() {
    return <SourceDropConnectedInternalMosaicWindow {...this.props as InternalMosaicWindowProps<T>} />;
  }
}

// Factory that works with generics
export function MosaicWindowFactory<T extends MosaicKey = string>(
  props: MosaicWindowProps<T> & React.Attributes,
  ...children: React.ReactNode[]
) {
  const element: React.ReactElement<MosaicWindowProps<T>> = React.createElement(
    (InternalMosaicWindow as any) as React.ComponentClass<MosaicWindowProps<T>>,
    props,
    ...children,
  );
  return element;
}
