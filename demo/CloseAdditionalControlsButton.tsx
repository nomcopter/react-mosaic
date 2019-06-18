import { Classes } from '@blueprintjs/core';
import classNames from 'classnames';
import React from 'react';

import { MosaicWindowContext } from '../src';

export class CloseAdditionalControlsButton extends React.PureComponent {
  static contextType = MosaicWindowContext;
  context!: MosaicWindowContext;

  render() {
    return (
      <div className={classNames(Classes.BUTTON_GROUP, Classes.MINIMAL)}>
        <button
          onClick={() => this.context.mosaicWindowActions.setAdditionalControlsOpen(false)}
          className={Classes.BUTTON}
        >
          Proof of Concept Button!
        </button>
      </div>
    );
  }
}
