import { Classes as ClassesImport, IIconProps } from '@blueprintjs/core';
import { IconNames as IconNamesTypeImport } from '@blueprintjs/icons';
import * as React from 'react';

export namespace OptionalBlueprint {
  type Classes = typeof ClassesImport;
  let Classes: Classes | undefined;
  export let Icon: React.ReactType<IIconProps>;
  type IconNames = typeof IconNamesTypeImport;
  let IconNames: IconNames | undefined;
  try {
    // Webpack is quieter about these errors
    // https://github.com/nomcopter/react-mosaic/issues/109
    require.resolve('@blueprintjs/core');
    require.resolve('@blueprintjs/icons');
    ({ Classes, Icon } = require('@blueprintjs/core'));
    ({ IconNames } = require('@blueprintjs/icons'));
  } catch {
    Icon = ({ icon }: IIconProps) => <span>{icon}</span>;
  }

  type BlueprintClass = { [K in keyof Classes]: Classes[K] extends string ? K : never }[keyof Classes];
  export function getClasses(...names: BlueprintClass[]): string {
    if (Classes) {
      return names.map((name) => Classes![name]).join(' ');
    }

    return '';
  }

  export function getIconClass(iconName: keyof IconNames): string {
    if (Classes && IconNames) {
      return Classes.iconClass(IconNames[iconName]);
    }

    return '';
  }
}
