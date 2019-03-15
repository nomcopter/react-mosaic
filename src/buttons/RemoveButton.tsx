import classNames from 'classnames';
import React from 'react';

import { MosaicWindowContext } from '../contextTypes';
import { MosaicKey } from '../types';
import { OptionalBlueprint } from '../util/OptionalBlueprint';
import { createDefaultToolbarButton, MosaicButtonProps } from './MosaicButton';

export class RemoveButton<T extends MosaicKey> extends React.PureComponent<MosaicButtonProps> {
  static contextTypes = MosaicWindowContext;
  context!: MosaicWindowContext<T>;

  render() {
    return createDefaultToolbarButton(
      'Close Window',
      classNames('close-button', OptionalBlueprint.getIconClass('CROSS')),
      this.remove,
    );
  }

  private remove = () => {
    this.context.mosaicActions.remove(this.context.mosaicWindowActions.getPath());
    if (this.props.onClick) {
      this.props.onClick();
    }
  };
}

export const RemoveButtonFactory = React.createFactory(RemoveButton);
