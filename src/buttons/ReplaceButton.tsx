import classNames from 'classnames';
import noop from 'lodash/noop';
import React from 'react';

import { MosaicWindowContext } from '../contextTypes';
import { OptionalBlueprint } from '../util/OptionalBlueprint';
import { DefaultToolbarButton, MosaicButtonProps } from './MosaicButton';

export class ReplaceButton extends React.PureComponent<MosaicButtonProps> {
  static contextType = MosaicWindowContext;
  context!: MosaicWindowContext;

  render() {
    return (
      <DefaultToolbarButton
        title="Replace Window"
        className={classNames(
          'replace-button',
          OptionalBlueprint.getIconClass(this.context.blueprintNamespace, 'EXCHANGE'),
        )}
        onClick={this.replace}
      />
    );
  }

  private replace = () => {
    this.context.mosaicWindowActions
      .replaceWithNew()
      .then(() => {
        if (this.props.onClick) {
          this.props.onClick();
        }
      })
      .catch(noop); // Swallow rejections (i.e. on user cancel)
  };
}
