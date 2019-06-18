import classNames from 'classnames';
import noop from 'lodash/noop';
import React from 'react';

import { MosaicContext } from './contextTypes';
import { CreateNode, MosaicKey } from './types';
import { OptionalBlueprint } from './util/OptionalBlueprint';

export interface MosaicZeroStateProps<T extends MosaicKey> {
  createNode?: CreateNode<T>;
}

export class MosaicZeroState<T extends MosaicKey> extends React.PureComponent<MosaicZeroStateProps<T>> {
  static contextType = MosaicContext;
  context!: MosaicContext<T>;

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
