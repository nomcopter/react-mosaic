import { Classes as ClassesImport, Icon as IconImport } from '@blueprintjs/core';
import { IconNames as IconNamesImport } from '@blueprintjs/icons';
import * as React from 'react';

export namespace OptionalBlueprint {
  const Classes = ClassesImport;
  const IconNames = IconNamesImport;

  export let Icon = IconImport;

  type ClassName = keyof typeof Classes;
  export function getClasses(...names: ClassName[]): string {
    return names.map((name) => Classes[name]).join(' ');
  }

  type IconName = keyof typeof IconNamesImport;
  export function getIconClass(iconName: IconName): string {
    return Classes.iconClass(IconNames[iconName]);
  }
}
