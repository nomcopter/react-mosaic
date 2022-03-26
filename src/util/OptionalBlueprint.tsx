import type { Classes } from '@blueprintjs/core';
import type { IconNames } from '@blueprintjs/icons';
import classNames from 'classnames';
import _ from 'lodash';
import * as React from 'react';

// The fallback in case
// the module doesn't exist or there is
// some other error.
const BLUEPRINT_CLASS_NAMESPACE_FALLBACK = 'bp3';

// Performs a top level import of blueprint and gets the
// namespace from the Classes export.
async function getBluePrintClassNamespace() {
  // Wrap in a try/catch.
  try
  {
    // Import the module.
    const module = await import("@blueprintjs/core")

    // If we're here, we have the module, get Classes from  it
    // and get the namespace.
    return module.Classes.getClassNamespace()
  }
  catch (ex) {
    // Ignore for now.
  }

  // Return the fallback.
  return BLUEPRINT_CLASS_NAMESPACE_FALLBACK
}

// Get the blueprint class namespace.
const BP_NAMESPACE = await getBluePrintClasses()

export namespace OptionalBlueprint {
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
