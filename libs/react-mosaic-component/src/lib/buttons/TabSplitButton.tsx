import classNames from 'classnames';
import { noop } from 'lodash-es';
import React from 'react';

import { MosaicContext } from '../contextTypes';
import { MosaicPath } from '../types';
import { OptionalBlueprint } from '../util/OptionalBlueprint';
import { DefaultToolbarButton, MosaicButtonProps } from './MosaicButton';

export interface TabSplitButtonProps extends MosaicButtonProps {
  path: MosaicPath;
}

export class TabSplitButton extends React.PureComponent<TabSplitButtonProps> {
  static contextType = MosaicContext;
  declare context: React.ContextType<typeof MosaicContext>;

  render() {
    return (
      <DefaultToolbarButton
        title="Split Tab Group"
        className={classNames(
          'split-button',
          OptionalBlueprint.getIconClass(
            this.context.blueprintNamespace,
            'SPLIT_COLUMNS',
          ),
        )}
        onClick={this.split}
      />
    );
  }

  private split = () => {
    const { mosaicActions } = this.context;
    const { path } = this.props;

    if (mosaicActions.createNode == null) {
      console.error(
        'Operation invalid unless `createNode` is defined on Mosaic',
      );
      return;
    }

    Promise.resolve(mosaicActions.createNode())
      .then((newNode) => {
        if (!newNode) return;

        // Get current tabs node
        const currentNode = this.getCurrentTabsNode();
        if (!currentNode) return;

        // Create a new split node with the tabs node and the new node
        const newSplitNode = {
          type: 'split' as const,
          direction: 'row' as const,
          splitPercentages: [50, 50],
          children: [currentNode, newNode],
        };

        // Replace the tabs node with the new split
        mosaicActions.replaceWith(path, newSplitNode, {
          type: 'split',
          path,
          node: newNode,
        });

        if (this.props.onClick) {
          this.props.onClick();
        }
      })
      .catch(noop);
  };

  private getCurrentTabsNode = () => {
    const root = this.context.mosaicActions.getRoot();
    if (!root) return null;

    // Navigate to the tabs node at the given path
    let currentNode = root;
    for (const index of this.props.path) {
      if (typeof currentNode === 'object' && 'children' in currentNode) {
        currentNode = currentNode.children[index];
      } else {
        return null;
      }
    }

    return currentNode;
  };
}
