import React, { JSX } from 'react';

import { MosaicContext } from './contextTypes';
import { Split } from './Split';
import {
  MosaicNode,
  MosaicKey,
  MosaicPath,
  MosaicSplitNode,
  TileRenderer,
  ResizeOptions,
  LegacyMosaicNode,
  TabToolbarRenderer,
  TabTitleRenderer,
  TabButtonRenderer,
  TabCanCloseFunction,
  TabToolbarControlsRenderer,
} from './types';
import {
  BoundingBox,
  boundingBoxAsStyles,
  emptyBoundingBox,
  splitBoundingBox,
} from './util/BoundingBox';
import { convertLegacyToNary } from './util/mosaicUtilities';
import { MosaicTabs } from './MosaicTabs';

export interface MosaicRootProps<T extends MosaicKey> {
  root: MosaicNode<T> | LegacyMosaicNode<T>;
  renderTile: TileRenderer<T>;
  renderTabToolbar?: TabToolbarRenderer<T>;
  resize?: ResizeOptions;
  renderTabTitle?: TabTitleRenderer<T>;
  renderTabButton?: TabButtonRenderer<T>;
  canClose?: TabCanCloseFunction<T>;
  showTabDragButton?: (path: MosaicPath) => boolean;
  renderTabToolbarControls?: TabToolbarControlsRenderer<T>;
}

export class MosaicRoot<T extends MosaicKey> extends React.PureComponent<
  MosaicRootProps<T>
> {
  static contextType = MosaicContext;
  declare context: React.ContextType<typeof MosaicContext>;

  render() {
    const naryRoot = convertLegacyToNary(this.props.root);

    if (naryRoot === null) {
      return null;
    }

    const tiles: JSX.Element[] = [];
    const splits: JSX.Element[] = [];
    this.collectElements(naryRoot, emptyBoundingBox(), [], tiles, splits);

    // Tiles are absolutely positioned, so their DOM order doesn't matter.
    // Rendering them as one flat list sorted by key means moving a panel
    // anywhere in the tree neither remounts it nor moves its DOM node (which
    // would reload an <iframe>). Splits come last so they stay on top.
    // Trade-off: DOM order, and so Tab focus and screen reader order, follows
    // the keys rather than the layout. Consumers who need layout order can set
    // `tabindex` or `aria-flowto` on their tile content.
    tiles.sort(compareByKey);

    return (
      <div className="mosaic-root">
        {tiles}
        {splits}
      </div>
    );
  }

  // Walks the n-ary tree, collecting absolutely positioned tiles and splits
  private collectElements(
    node: MosaicNode<T>,
    boundingBox: BoundingBox,
    path: MosaicPath,
    tiles: JSX.Element[],
    splits: JSX.Element[],
  ): void {
    // Case 1: Node is a leaf (a single panel)
    if (typeof node === 'string' || typeof node === 'number') {
      tiles.push(
        <div
          key={`${LEAF_KEY_PREFIX}${node}`}
          className="mosaic-tile"
          style={{ ...boundingBoxAsStyles(boundingBox) }}
        >
          {this.props.renderTile(node, path)}
        </div>,
      );
      return;
    }

    // Node is an object, so it's either a Split or Tabs node
    switch (node.type) {
      // Case 2: Node is a split container
      case 'split': {
        const { children, direction } = node;
        // Default to equal splits if not provided
        const splitPercentages =
          node.splitPercentages ?? children.map(() => 100 / children.length);

        // Utility to split a bounding box into N parts
        const childBoxes = splitBoundingBox(
          boundingBox,
          splitPercentages,
          direction,
        );

        children.forEach((child, index) => {
          this.collectElements(
            child,
            childBoxes[index],
            path.concat(index),
            tiles,
            splits,
          );

          // Add a Splitter between each child, except the last one
          if (index < children.length - 1) {
            const split = this.renderSplit(node, path, index, boundingBox);
            if (split !== null) {
              splits.push(split);
            }
          }
        });
        return;
      }

      // Case 3: Node is a tab container
      case 'tabs': {
        // Key the group by its smallest tab key rather than its position:
        // sibling insertions/removals and in-group reorders then keep the key
        // stable, so the group (and its active tile's DOM and state) survives.
        // Unique among tiles because leaf IDs are unique tree-wide, and the
        // prefixes keep a leaf ID like `tabs:a` from matching a group key.
        tiles.push(
          <MosaicTabs<T>
            key={`${TABS_KEY_PREFIX}${[...node.tabs].sort()[0]}`}
            node={node}
            path={path}
            renderTile={this.props.renderTile}
            renderTabToolbar={this.props.renderTabToolbar}
            boundingBox={boundingBox}
            renderTabTitle={this.props.renderTabTitle}
            renderTabButton={this.props.renderTabButton}
            showTabDragButton={this.props.showTabDragButton}
            renderTabToolbarControls={this.props.renderTabToolbarControls}
            canClose={this.props.canClose}
          />,
        );
        return;
      }

      default:
        // Should not happen with valid node types
        console.error('Unknown mosaic node type:', node);
    }
  }

  private renderSplit(
    parentNode: MosaicSplitNode<T>,
    path: MosaicPath,
    splitIndex: number,
    boundingBox: BoundingBox,
  ) {
    const { resize } = this.props;
    if (resize !== 'DISABLED' && parentNode.children.length > 1) {
      const { direction } = parentNode;
      // Default to equal splits if not provided
      const splitPercentages =
        parentNode.splitPercentages ??
        parentNode.children.map(() => 100 / parentNode.children.length);

      return (
        <Split
          key={`split-${path.join('-')}-${splitIndex}`}
          {...resize}
          direction={direction}
          boundingBox={boundingBox}
          splitIndex={splitIndex}
          depth={path.length}
          splitPercentages={splitPercentages}
          onChange={(percentages) => this.onResize(percentages, path, true)}
          onRelease={(percentages) => this.onResize(percentages, path, false)}
        />
      );
    } else {
      return null;
    }
  }

  // onResize now handles an array of percentages
  private onResize = (
    percentages: number[],
    path: MosaicPath,
    suppressOnRelease: boolean,
  ) => {
    this.context.mosaicActions.updateTree(
      [
        {
          path, // Path to the parent MosaicSplitNode
          spec: {
            splitPercentages: {
              $set: percentages,
            },
          },
        },
      ],
      { suppressOnRelease },
    );
  };
}

// Every tile key starts with one of these, so a leaf key can never equal a
// tab group key whatever the user's panel IDs are.
const LEAF_KEY_PREFIX = 'leaf:';
const TABS_KEY_PREFIX = 'tabs:';

function compareByKey(a: JSX.Element, b: JSX.Element): number {
  const keyA = String(a.key);
  const keyB = String(b.key);
  return keyA < keyB ? -1 : keyA > keyB ? 1 : 0;
}
