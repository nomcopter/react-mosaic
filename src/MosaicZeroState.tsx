import classNames from 'classnames';
import noop from 'lodash/noop';
import React from 'react';

import { MosaicActionsPropType, MosaicContext } from './contextTypes';
import { CreateNode, MosaicKey } from './types';
import { OptionalBlueprint } from './util/OptionalBlueprint';

export interface MosaicZeroStateProps<T extends MosaicKey> {
  createNode?: CreateNode<T>;
}

export class MosaicZeroState<T extends MosaicKey> extends React.PureComponent<MosaicZeroStateProps<T>> {
  context!: MosaicContext<T>;

  static contextTypes = {
    mosaicActions: MosaicActionsPropType,
  };

  render() {
    return (
      <div className={classNames('mosaic-zero-state', OptionalBlueprint.getClasses('NON_IDEAL_STATE'))}>
        <div className={OptionalBlueprint.getClasses('NON_IDEAL_STATE_VISUAL')}>
          <OptionalBlueprint.Icon iconSize={120} icon="applications" />
        </div>
        <h4 className={OptionalBlueprint.getClasses('HEADING')}>No Windows Present</h4>
        <div>
          {this.props.createNode && (
            <button
              className={classNames(OptionalBlueprint.getClasses('BUTTON'), OptionalBlueprint.getIconClass('ADD'))}
              onClick={this.replace}
            >
              Add New Window
            </button>
          )}
        </div>
      </div>
    );
  }

  private replace = () =>
    Promise.resolve(this.props.createNode!())
      .then((node) => this.context.mosaicActions.replaceWith([], node))
      .catch(noop); // Swallow rejections (i.e. on user cancel)
}

// Factory that works with generics
export function MosaicZeroStateFactory<T extends MosaicKey>(
  props?: MosaicZeroStateProps<T> & React.Attributes,
  ...children: React.ReactNode[]
) {
  const element: React.ReactElement<MosaicZeroStateProps<T>> = React.createElement(
    MosaicZeroState as React.ComponentClass<MosaicZeroStateProps<T>>,
    props,
    ...children,
  );
  return element;
}
