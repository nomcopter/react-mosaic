import classNames from 'classnames';
import React from 'react';

import { MosaicContext, MosaicRootActions, MosaicWindowContext } from '../contextTypes';
import { OptionalBlueprint } from '../util/OptionalBlueprint';
import { DefaultToolbarButton, MosaicButtonProps } from './MosaicButton';

export class RemoveButton extends React.PureComponent<MosaicButtonProps> {
  static contextType = MosaicWindowContext;
  context!: MosaicWindowContext;

  render() {
    return (
      <MosaicContext.Consumer>
        {({ mosaicActions, blueprintNamespace }) => (
          <DefaultToolbarButton
            title="Close Window"
            className={classNames('close-button', OptionalBlueprint.getIconClass(blueprintNamespace, 'CROSS'))}
            onClick={this.createRemove(mosaicActions)}
          />
        )}
      </MosaicContext.Consumer>
    );
  }

  private createRemove(mosaicActions: MosaicRootActions<any>) {
    return () => {
      mosaicActions.remove(this.context.mosaicWindowActions.getPath());

      if (this.props.onClick) {
        this.props.onClick();
      }
    };
  }
}
