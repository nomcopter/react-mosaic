import classNames from 'classnames';
import React from 'react';

import { MosaicContext } from '../contextTypes';
import { MosaicPath } from '../types';

export interface DefaultAddTabButtonProps {
  path: MosaicPath;
  className?: string;
  title?: string;
  ariaLabel?: string;
  children?: React.ReactNode;
}

export const DefaultAddTabButton: React.FC<DefaultAddTabButtonProps> = ({
  path,
  className,
  title = 'Add new tab',
  ariaLabel = 'Add new tab',
  children = '+',
}) => {
  const { mosaicActions } = React.useContext(MosaicContext);
  return (
    <button
      className={classNames('mosaic-tab-add-button', className)}
      onClick={() => {
        mosaicActions.addTab(path).catch((err) => console.error(err));
      }}
      aria-label={ariaLabel}
      title={title}
    >
      {children}
    </button>
  );
};
