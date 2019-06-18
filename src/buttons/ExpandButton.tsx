import classNames from 'classnames';
import React from 'react';

import { MosaicContext, MosaicRootActions, MosaicWindowContext } from '../contextTypes';
import { OptionalBlueprint } from '../util/OptionalBlueprint';
import { createDefaultToolbarButton, MosaicButtonProps } from './MosaicButton';

export class ExpandButton extends React.PureComponent<MosaicButtonProps> {
  static contextType = MosaicWindowContext;
  context!: MosaicWindowContext;

  render() {
    return (
      <MosaicContext.Consumer>
        {({ mosaicActions }) =>
          createDefaultToolbarButton(
            'Expand',
            classNames('expand-button', OptionalBlueprint.getIconClass('MAXIMIZE')),
            this.createExpand(mosaicActions),
          )
        }
      </MosaicContext.Consumer>
    );
  }

  private createExpand(mosaicActions: MosaicRootActions<any>) {
    return () => {
      mosaicActions.expand(this.context.mosaicWindowActions.getPath());

      if (this.props.onClick) {
        this.props.onClick();
      }
    };
  }
}
