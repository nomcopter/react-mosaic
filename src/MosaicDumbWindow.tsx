import classNames from 'classnames';
import defer from 'lodash/defer';
import dropRight from 'lodash/dropRight';
import isEmpty from 'lodash/isEmpty';
import isEqual from 'lodash/isEqual';
import React from 'react';
import { ConnectDragPreview, ConnectDragSource, DragSource, DragSourceMonitor } from 'react-dnd';

import { DEFAULT_CONTROLS_WITH_CREATION, DEFAULT_CONTROLS_WITHOUT_CREATION } from './buttons/defaultToolbarControls';
import { Separator } from './buttons/Separator';
import { MosaicContext, MosaicWindowContext } from './contextTypes';
import { MosaicDragItem, MosaicDropData } from './internalTypes';
import { CreateNode, MosaicBranch, MosaicDirection, MosaicDragType, MosaicKey } from './types';
import { createDragToUpdates } from './util/mosaicUpdates';
import { getAndAssertNodeAtPathExists } from './util/mosaicUtilities';
import { OptionalBlueprint } from './util/OptionalBlueprint';

export interface MosaicDumbWindowProps<T extends MosaicKey> {
  title: string;
  path: MosaicBranch[];
  className?: string;
  toolbarControls?: React.ReactNode;
  additionalControls?: React.ReactNode;
  additionalControlButtonText?: string;
  draggable?: boolean;
  createNode?: CreateNode<T>;
  renderPreview?: (props: MosaicDumbWindowProps<T>) => JSX.Element;
  renderToolbar?: ((props: MosaicDumbWindowProps<T>, draggable: boolean | undefined) => JSX.Element) | null;
  onDragStart?: () => void;
  onDragEnd?: (type: 'drop' | 'reset') => void;
}

export interface InternalNestedDragSourceProps {
  connectDragSource: ConnectDragSource;
  connectDragPreview: ConnectDragPreview;
}

export type InternalMosaicDumbWindowProps<T extends MosaicKey> = MosaicDumbWindowProps<T> &
  InternalNestedDragSourceProps;

export interface InternalMosaicDumbWindowState {
  additionalControlsOpen: boolean;
}

export class InternalMosaicDumbWindow<T extends MosaicKey> extends React.Component<
  InternalMosaicDumbWindowProps<T>,
  InternalMosaicDumbWindowState
> {
  static defaultProps: Partial<InternalMosaicDumbWindowProps<any>> = {
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
  static contextType = MosaicContext;
  context!: MosaicContext<T>;

  state: InternalMosaicDumbWindowState = {
    additionalControlsOpen: false,
  };

  private rootElement: HTMLElement | null = null;

  render() {
    const { className, renderPreview, additionalControls, connectDragPreview } = this.props;

    return (
      <MosaicWindowContext.Provider value={this.childContext}>
        <div
          className={classNames('mosaic-window', className, {
            'additional-controls-open': this.state.additionalControlsOpen,
          })}
          ref={(element) => (this.rootElement = element)}
        >
          {this.renderToolbar()}
          <div className="mosaic-window-body">{this.props.children!}</div>
          <div className="mosaic-window-body-overlay" onClick={() => this.setAdditionalControlsOpen(false)} />
          <div className="mosaic-window-additional-actions-bar">{additionalControls}</div>
          {connectDragPreview(renderPreview!(this.props))}
        </div>
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

  private readonly childContext: MosaicWindowContext = {
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
    props: InternalMosaicDumbWindowProps<any>,
    _monitor: DragSourceMonitor,
    component: InternalMosaicDumbWindow<any>,
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
    props: InternalMosaicDumbWindowProps<any>,
    monitor: DragSourceMonitor,
    component: InternalMosaicDumbWindow<any>,
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

// Each step exported here just to keep react-hot-loader happy
export const SourceConnectedInternalMosaicDumbWindow = DragSource(
  MosaicDragType.WINDOW,
  dragSource,
  (connect, _monitor): InternalNestedDragSourceProps => ({
    connectDragSource: connect.dragSource(),
    connectDragPreview: connect.dragPreview(),
  }),
)(InternalMosaicDumbWindow);

export class MosaicDumbWindow<T extends MosaicKey = string> extends React.PureComponent<MosaicDumbWindowProps<T>> {
  render() {
    return <SourceConnectedInternalMosaicDumbWindow {...(this.props as InternalMosaicDumbWindowProps<T>)} />;
  }
}
