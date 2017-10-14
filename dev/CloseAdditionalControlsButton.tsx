import * as React from 'react';
import { MosaicWindowContext } from '../src/index';

export class CloseAdditionalControlsButton extends React.PureComponent {
  static contextTypes = MosaicWindowContext;
  context: MosaicWindowContext<number>;

  render() {
    return (
      <div className='pt-button-group pt-minimal'>
        <button
          onClick={() => this.context.mosaicWindowActions.setAdditionalControlsOpen(false)}
          className='pt-button'
        >
          Proof of Concept Button!
        </button>
      </div>
    );
  }
}
