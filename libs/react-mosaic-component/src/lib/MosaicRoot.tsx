import { flatten } from 'lodash-es';
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
  AddTabButtonRenderer,
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
  renderAddTabButton?: AddTabButtonRenderer<T>;
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

    return (
      <div className="mosaic-root">
        {this.renderRecursively(naryRoot, emptyBoundingBox(), [])}
      </div>
    );
  }

  // The recursive renderer is now updated for the n-ary tree structure
  private renderRecursively(
    node: MosaicNode<T>,
    boundingBox: BoundingBox,
    path: MosaicPath,
  ): JSX.Element | null {
    // Case 1: Node is a leaf (a single panel)
    if (typeof node === 'string' || typeof node === 'number') {
      return (
        <div
          key={node}
          className="mosaic-tile"
          style={{ ...boundingBoxAsStyles(boundingBox) }}
        >
          {this.props.renderTile(node, path)}
        </div>
      );
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

        const renderedChildren = children.flatMap((child, index) => {
          const childPath = path.concat(index);
          const elements = [
            this.renderRecursively(child, childBoxes[index], childPath),
          ];

          // Add a Splitter between each child, except the last one
          if (index < children.length - 1) {
            elements.push(this.renderSplit(node, path, index, boundingBox));
          }
          return elements;
        });

        const flattenedElements =
          flatten(renderedChildren).filter(nonNullElement);
        return (
          <>
            {flattenedElements.map((element, index) =>
              React.cloneElement(element, {
                key: element.key || `${path.join('-')}-${index}`,
              }),
            )}
          </>
        );
      }

      // Case 3: Node is a tab container
      case 'tabs': {
        return (
          <MosaicTabs<T>
            node={node}
            path={path}
            renderTile={this.props.renderTile}
            renderTabToolbar={this.props.renderTabToolbar}
            boundingBox={boundingBox}
            renderTabTitle={this.props.renderTabTitle}
            renderTabButton={this.props.renderTabButton}
            showTabDragButton={this.props.showTabDragButton}
            renderTabToolbarControls={this.props.renderTabToolbarControls}
            renderAddTabButton={this.props.renderAddTabButton}
            canClose={this.props.canClose}
          />
        );
      }

      default:
        // Should not happen with valid node types
        console.error('Unknown mosaic node type:', node);
        return null;
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

function nonNullElement(x: JSX.Element | null): x is JSX.Element {
  return x !== null;
}
