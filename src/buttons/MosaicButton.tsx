import classNames from 'classnames';
import React from 'react';

import { OptionalBlueprint } from '../util/OptionalBlueprint';

export function createDefaultToolbarButton(
  title: string,
  className: string,
  onClick: (event: React.MouseEvent<any>) => any,
  text?: string,
): React.ReactElement<any> {
  return (
    <button
      title={title}
      onClick={onClick}
      className={classNames('mosaic-default-control', OptionalBlueprint.getClasses('BUTTON', 'MINIMAL'), className)}
    >
      {text && <span className="control-text">{text}</span>}
    </button>
  );
}

export interface MosaicButtonProps {
  onClick?: () => void;
}
