import React from 'react';

import { MosaicConfiguration } from './types';

/**
 * Pure helpers for querying a {@link MosaicConfiguration}.
 */
export class MosaicConfigurationHelper {
  /** Checks if a component is locked (non-removable) in the given view. */
  static isComponentLocked(
    componentKey: string,
    currentViewKey: string,
    configuration: MosaicConfiguration,
  ): boolean {
    const currentView = configuration.views[currentViewKey];
    const locked = currentView && currentView.lockComponents;
    return locked != null && locked.indexOf(componentKey) !== -1;
  }

  /** Gets all locked components for a specific view. */
  static getLockedComponents(viewKey: string, configuration: MosaicConfiguration): string[] {
    const view = configuration.views[viewKey];
    return (view && view.lockComponents) || [];
  }

  /** Checks if a component exists in the configuration. */
  static componentExists(componentKey: string, configuration: MosaicConfiguration): boolean {
    return componentKey in configuration.components;
  }

  /** Gets the title of a component. */
  static getComponentTitle(componentKey: string, configuration: MosaicConfiguration): React.ReactNode {
    const component = configuration.components[componentKey];
    return component ? component.title : undefined;
  }

  /** Gets all available component keys. */
  static getAllComponentKeys(configuration: MosaicConfiguration): string[] {
    return Object.keys(configuration.components);
  }
}
