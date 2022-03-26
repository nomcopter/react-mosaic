import { Classes } from '@blueprintjs/core';
import type { IconNames } from '@blueprintjs/icons';
import classNames from 'classnames';
import _ from 'lodash';
import * as React from 'react';

export namespace OptionalBlueprint {
  const BP_NAMESPACE = Classes.getClassNamespace();
  export const Icon = ({
    icon,
    className,
    size = 'standard',
  }: {
    icon: keyof typeof IconNames;
    className?: string;
    size?: 'standard' | 'large';
  }) => <span className={classNames(className, getIconClass(icon), `${BP_NAMESPACE}-icon-${size}`)} />;

  type BlueprintClass = {
    [K in keyof typeof Classes]: typeof Classes[K] extends string ? K : never;
  }[keyof typeof Classes];
  export function getClasses(...names: BlueprintClass[]): string {
    return names.map((name) => `${BP_NAMESPACE}-${_.kebabCase(name)}`).join(' ');
  }

  export function getIconClass(iconName: keyof typeof IconNames): string {
    return `${BP_NAMESPACE}-icon-${_.kebabCase(iconName)}`;
  }
}
