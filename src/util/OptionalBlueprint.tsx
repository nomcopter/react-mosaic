import type { Classes } from '@blueprintjs/core';
import type { IconNames } from '@blueprintjs/icons';
import classNames from 'classnames';
import _ from 'lodash';
import * as React from 'react';

// Performs a top level import of blueprint and gets the classes.
async function getBluePrintClasses() {
  // The classes.
  let classes: Classes | undefined

  // Wrap in a try/catch.
  try
  {
    // Import the module.
    const module = await import("@blueprintjs/core")

    // If we're here, we have the module, get classes from  it.
    classes = module.Classes
  }
  catch (ex) {
    // Ignore for now.
  }

  // Return the classes.
  return classes
}

// Get the classes.
const BlueprintClasses: Classes | undefined = await getBluePrintClasses()

export namespace OptionalBlueprint {
  const BP_NAMESPACE = BlueprintClasses?.getClassNamespace() ?? 'bp3';
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
