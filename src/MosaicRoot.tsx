import flatten from 'lodash/flatten';
import React from 'react';
import { MosaicContext } from './contextTypes';
import { Split } from './Split';
import { MosaicBranch, MosaicDirection, MosaicKey, MosaicNode, ResizeOptions, TileRenderer } from './types';
import { BoundingBox } from './util/BoundingBox';
import { isParent } from './util/mosaicUtilities';

export interface MosaicRootProps<T extends MosaicKey> {
  root: MosaicNode<T>;
  renderTile: TileRenderer<T>;
  resize?: ResizeOptions;
}

export class MosaicRoot<T extends MosaicKey> extends React.PureComponent<MosaicRootProps<T>> {
  static contextType = MosaicContext;
  context!: MosaicContext<T>;

  render() {
    const { root } = this.props;
    return <div className="mosaic-root">{this.renderRecursively(root, BoundingBox.empty(), [])}</div>;
  }

  private renderRecursively(
    node: MosaicNode<T>,
    boundingBox: BoundingBox,
    path: MosaicBranch[],
  ): JSX.Element | JSX.Element[] {
    if (isParent(node)) {
      const splitPercentage = node.splitPercentage == null ? 50 : node.splitPercentage;
      const { first, second } = BoundingBox.split(boundingBox, splitPercentage, node.direction);
      return flatten(
        [
          this.renderRecursively(node.first, first, path.concat('first')),
          this.renderSplit(node.direction, boundingBox, splitPercentage, path),
          this.renderRecursively(node.second, second, path.concat('second')),
        ].filter(nonNullElement),
      );
    } else {
      return (
        <div key={node} className="mosaic-tile" style={{ ...BoundingBox.asStyles(boundingBox) }}>
          {this.props.renderTile(node, path)}
        </div>
      );
    }
  }

  private renderSplit(
    direction: MosaicDirection,
    boundingBox: BoundingBox,
    splitPercentage: number,
    path: MosaicBranch[],
  ) {
    const { resize } = this.props;
    if (resize !== 'DISABLED') {
      return (
        <Split
          key={path.join(',') + 'splitter'}
          {...resize}
          boundingBox={boundingBox}
          splitPercentage={splitPercentage}
          direction={direction}
          onChange={(percentage) => this.onResize(percentage, path, true)}
          onRelease={(percentage) => this.onResize(percentage, path, false)}
        />
      );
    } else {
      return null;
    }
  }

  private onResize = (percentage: number, path: MosaicBranch[], suppressOnRelease: boolean) => {
    this.context.mosaicActions.updateTree(
      [
        {
          path,
          spec: {
            splitPercentage: {
              $set: percentage,
            },
          },
        },
      ],
      suppressOnRelease,
    );
  };
}

function nonNullElement(x: JSX.Element | JSX.Element[] | null): x is JSX.Element | JSX.Element[] {
  return x !== null;
}
