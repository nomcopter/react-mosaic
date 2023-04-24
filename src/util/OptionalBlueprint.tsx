import type { Classes } from '@blueprintjs/core';
import type { IconNames } from '@blueprintjs/icons';
import classNames from 'classnames';
import kebabCase from 'lodash/kebabCase';
import * as React from 'react';
import { MosaicContext } from '../contextTypes';

export namespace OptionalBlueprint {
  export const Icon = ({
    icon,
    className,
    size = 'standard',
  }: {
    icon: keyof typeof IconNames;
    className?: string;
    size?: 'standard' | 'large';
  }) => {
    const { blueprintNamespace } = React.useContext(MosaicContext);
    return (
      <span
        className={classNames(className, getIconClass(blueprintNamespace, icon), `${blueprintNamespace}-icon-${size}`)}
      />
    );
  };

  type BlueprintClass = {
    [K in keyof typeof Classes]: (typeof Classes)[K] extends string ? K : never;
  }[keyof typeof Classes];

  export function getClasses(blueprintNamespace: string, ...names: BlueprintClass[]): string {
    return names.map((name) => `${blueprintNamespace}-${kebabCase(name)}`).join(' ');
  }

  export function getIconClass(blueprintNamespace: string, iconName: keyof typeof IconNames): string {
    return `${blueprintNamespace}-icon-${kebabCase(iconName)}`;
  }
}
