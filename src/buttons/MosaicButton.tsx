import classNames from 'classnames';
import React from 'react';
import { MosaicContext } from '../contextTypes';

import { OptionalBlueprint } from '../util/OptionalBlueprint';

export const DefaultToolbarButton = ({
  title,
  className,
  onClick,
  text,
}: {
  title: string;
  className: string;
  onClick: (event: React.MouseEvent<any>) => any;
  text?: string;
}) => {
  const { blueprintNamespace } = React.useContext(MosaicContext);
  return (
    <button
      title={title}
      onClick={onClick}
      className={classNames(
        'mosaic-default-control',
        OptionalBlueprint.getClasses(blueprintNamespace, 'BUTTON', 'MINIMAL'),
        className,
      )}
    >
      {text && <span className="control-text">{text}</span>}
    </button>
  );
};

/**
 * @deprecated: see @DefaultToolbarButton
 */
export const createDefaultToolbarButton = (
  title: string,
  className: string,
  onClick: (event: React.MouseEvent<any>) => any,
  text?: string,
) => <DefaultToolbarButton title={title} className={className} onClick={onClick} text={text} />;

export interface MosaicButtonProps {
  onClick?: () => void;
}
