import { Classes } from '@blueprintjs/core';
import { MosaicWindowContext } from 'react-mosaic-component';
import classNames from 'classnames';
import React, { useContext } from 'react';

export const CloseAdditionalControlsButton: React.FC = () => {
  const { mosaicWindowActions } = useContext(MosaicWindowContext);
  return (
    <div className={classNames(Classes.BUTTON_GROUP, Classes.MINIMAL)}>
      <button
        type="button"
        className={Classes.BUTTON}
        onClick={() => mosaicWindowActions.setAdditionalControlsOpen(false)}
      >
        Proof of Concept Button!
      </button>
    </div>
  );
};
