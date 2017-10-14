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
import * as classNames from 'classnames';
import * as _ from 'lodash';
import * as React from 'react';
import { DragDropContext } from 'react-dnd';
import HTML5 from 'react-dnd-html5-backend';
import { v4 as uuid } from 'uuid';
import { MosaicContext, MosaicRootActions } from './contextTypes';
import { MosaicDropTargetPosition } from './internalTypes';
import { MosaicWindowDropTarget } from './MosaicDropTarget';
import { MosaicTile } from './MosaicTile';
import { createExpandUpdate, createHideUpdate, createRemoveUpdate, updateTree } from './mosaicUpdates';
import { MosaicZeroState } from './MosaicZeroState';
import { MosaicNode, MosaicPath, MosaicUpdate, ResizeOptions, TileRenderer } from './types';

const DEFAULT_EXPAND_PERCENTAGE = 70;

export interface MosaicBaseProps<T> {
  /**
   * Lookup function to convert `T` to a displayable `ReactElement`
   */
  renderTile: TileRenderer<T>;
  /**
   * Called when a user initiates any change to the tree (removing, adding, moving, resizing, etc.)
   */
  onChange?: (newNode: MosaicNode<T> | null) => void;
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
  zeroStateView?: JSX.Element;
}

export interface MosaicControlledProps<T> extends MosaicBaseProps<T> {
  /**
   * The tree to render
   */
  value: MosaicNode<T> | null;
  onChange: (newNode: MosaicNode<T> | null) => void;
}

export interface MosaicUncontrolledProps<T> extends MosaicBaseProps<T> {
  /**
   * The initial tree to render, can be modified by the user
   */
  initialValue: MosaicNode<T> | null;
}

export type MosaicProps<T> = MosaicControlledProps<T> | MosaicUncontrolledProps<T>;

function isUncontrolled<T>(props: MosaicProps<T>): props is MosaicUncontrolledProps<T> {
  return (props as MosaicUncontrolledProps<T>).initialValue != null;
}

export interface MosaicState<T> {
  currentNode: MosaicNode<T> | null;
  mosaicId: string;
}

export class MosaicWithoutDragDropContext<T> extends React.PureComponent<MosaicProps<T>, MosaicState<T>> {
  static defaultProps = {
    onChange: () => void 0,
    zeroStateView: <MosaicZeroState/>,
    className: 'mosaic-blueprint-theme',
  };

  static childContextTypes = MosaicContext;

  state: MosaicState<T> = {
    currentNode: null,
    mosaicId: uuid(),
  };

  getChildContext(): MosaicContext<T> {
    return {
      mosaicActions: this.actions,
      mosaicId: this.state.mosaicId,
    };
  }

  render() {
    const { className, renderTile, resize, zeroStateView } = this.props;
    const node = this.getRoot();

    return (
      <div
        className={classNames(className, 'mosaic-root mosaic-drop-target')}
      >
        {node == null ?
          zeroStateView : React.createElement(MosaicTile, {
            node, renderTile, resize,
            getPath: this.getPath,
          })
        }
        <div className='drop-target-container'>
          {_.values<MosaicDropTargetPosition>(MosaicDropTargetPosition).map((position) => (
            <MosaicWindowDropTarget
              position={position}
              path={[]}
              key={position}
            />
          ))}
        </div>
      </div>
    );
  }

  componentWillReceiveProps(nextProps: MosaicProps<T>) {
    if (isUncontrolled(nextProps) &&
      nextProps.initialValue !== (this.props as MosaicUncontrolledProps<T>).initialValue) {
      this.setState({ currentNode: nextProps.initialValue });
    }
  }

  componentWillMount() {
    const props: MosaicProps<T> = this.props;
    if (isUncontrolled(props)) {
      this.setState({ currentNode: props.initialValue });
    }
  }

  private getRoot(): MosaicNode<T> | null {
    const props: MosaicProps<T> = this.props;
    if (isUncontrolled(props)) {
      return this.state.currentNode!;
    } else {
      return props.value;
    }
  }

  private getPath = (): MosaicPath => [];

  private updateRoot = (updates: MosaicUpdate<T>[]) => {
    const currentNode = this.getRoot() || {} as MosaicNode<T>;

    this.replaceRoot(updateTree(currentNode, updates));
  };

  private replaceRoot = (currentNode: MosaicNode<T> | null) => {
    this.props.onChange!(currentNode);

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
        this.updateRoot([createRemoveUpdate(this.getRoot(), path)]);
      }
    },
    expand: (path: MosaicPath, percentage: number = DEFAULT_EXPAND_PERCENTAGE) =>
      this.updateRoot([createExpandUpdate<T>(path, percentage)]),
    getRoot: () => this.getRoot()!,
    hide: (path: MosaicPath) =>
      this.updateRoot([createHideUpdate<T>(path)]),
    replaceWith: (path: MosaicPath, newNode: MosaicNode<T>) =>
      this.updateRoot([{
        path,
        spec: {
          $set: newNode,
        },
      }]),
  };
}

@(DragDropContext(HTML5) as ClassDecorator)
export class Mosaic<T> extends MosaicWithoutDragDropContext<T> {
}

// Factory that works with generics
export function MosaicFactory<T>(props: MosaicProps<T> & React.Attributes, ...children: React.ReactNode[]) {
  const element: React.ReactElement<MosaicProps<T>> =
    React.createElement(Mosaic as React.ComponentClass<MosaicProps<T>>, props, ...children);
  return element;
}
