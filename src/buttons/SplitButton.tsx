import classNames from 'classnames';
import { noop } from 'lodash-es';
import React from 'react';

import { MosaicWindowContext } from '../contextTypes';
import { OptionalBlueprint } from '../util/OptionalBlueprint';
import { DefaultToolbarButton, MosaicButtonProps } from './MosaicButton';

export class SplitButton extends React.PureComponent<MosaicButtonProps> {
  static contextType = MosaicWindowContext;
  declare context: React.ContextType<typeof MosaicWindowContext>;

  render() {
    return (
      <DefaultToolbarButton
        title="Split Window"
        className={classNames(
          'split-button',
          OptionalBlueprint.getIconClass(this.context.blueprintNamespace, 'ADD_COLUMN_RIGHT'),
        )}
        onClick={this.split}
      />
    );
  }

  private split = () => {
    this.context.mosaicWindowActions
      .split()
      .then(() => {
        if (this.props.onClick) {
          this.props.onClick();
        }
      })
      .catch(noop); // Swallow rejections (i.e. on user cancel)
  };
}
