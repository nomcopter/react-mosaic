import React from 'react';

import { MosaicNode } from '../types';

/**
 * The tree structure representing a mosaic layout.
 * Either a single component key, a split node, or `null` (empty).
 */
export type MosaicSchema = MosaicNode<string> | null;

/**
 * A component that can be displayed in the managed mosaic layout.
 */
export interface MosaicComponent {
  title: React.ReactNode;
  component: React.ReactElement;
  /** Optional extra controls rendered at the left of the window toolbar */
  toolbarActions?: React.ReactNode;
}

/**
 * Map of component keys to their definitions.
 */
export type MosaicComponentMap = Record<string, MosaicComponent>;

/**
 * Definition of a view: its layout plus the components that may not be removed.
 */
export interface MosaicViewDefinition {
  layout: MosaicSchema;
  lockComponents?: string[];
}

/**
 * Visual style options that apply to every panel in a managed mosaic instance.
 */
export interface MosaicPanelStyle {
  /** Transparent panel bodies; the toolbar gets a glass/blur effect */
  transparentBackground?: boolean;
  /** Fully transparent body and toolbar — no glass effect */
  noBackground?: boolean;
  /** Frosted-glass blur on the window frame, transparent body */
  glassBackground?: boolean;
  /** Collapse the toolbar behind a small clickable pill indicator */
  hideToolbar?: boolean;
  /** Replace the sharp 1px ring with a barely-visible diffuse glow */
  noBorder?: boolean;
}

/**
 * Complete configuration for a managed mosaic instance.
 */
export interface MosaicConfiguration {
  /** Unique identifier for this mosaic instance */
  key: string;
  /** All available components that can be placed in views */
  components: MosaicComponentMap;
  /** Key of the default view */
  defaultViewKey: string;
  /** Predefined views with their layouts */
  views: Record<string, MosaicViewDefinition>;
  /** Optional visual style overrides applied to every panel */
  style?: MosaicPanelStyle;
}

/**
 * User-facing text used by the managed mosaic. Pass overrides to localize.
 */
export interface MosaicLabels {
  undefinedComponentTitle: string;
  undefinedComponentContent: (id: string) => string;
  expandTooltip: string;
  fullscreenTooltip: string;
  removePanelTooltip: string;
  toolbarOpen: string;
  toolbarClose: string;
  fullscreenClose: string;
}

export const DEFAULT_MOSAIC_LABELS: MosaicLabels = {
  undefinedComponentTitle: 'Untitled',
  undefinedComponentContent: (id: string) => `No component registered for "${id}"`,
  expandTooltip: 'Expand',
  fullscreenTooltip: 'Fullscreen',
  removePanelTooltip: 'Remove panel',
  toolbarOpen: 'Show toolbar',
  toolbarClose: 'Hide toolbar',
  fullscreenClose: 'Close',
};
