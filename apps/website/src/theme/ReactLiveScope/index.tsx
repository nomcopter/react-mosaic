import React from 'react';
import { useColorMode } from '@docusaurus/theme-common';
import {
  Mosaic,
  MosaicWindow,
  MosaicZeroState,
  MosaicTabs,
  DraggableTab,
  Separator,
  ExpandButton,
  RemoveButton,
  ReplaceButton,
  SplitButton,
  AddTabButton,
  TabSplitButton,
  TabRemoveButton,
  TabExpandButton,
  TabDragButton,
  DefaultAddTabButton,
  DefaultToolbarButton,
  MosaicContext,
  MosaicWindowContext,
  createBalancedTreeFromLeaves,
  getLeaves,
  getNodeAtPath,
  getParentNode,
  getParentPath,
  isSplitNode,
  isTabsNode,
  updateTree,
  createRemoveUpdate,
  createExpandUpdate,
  createHideUpdate,
  createDragToUpdates,
  convertLegacyToNary,
  DEFAULT_CONTROLS_WITH_CREATION,
  DEFAULT_CONTROLS_WITHOUT_CREATION,
  DEFAULT_CONTROLS_IN_TABS,
  createDefaultTabsControls,
} from 'react-mosaic-component';

// Live examples render with the Blueprint theme matching the site's color
// mode, so they don't show a light mosaic on a dark page. Snippets keep the
// plain `<Mosaic>` API; this wrapper only fills in the theme props.
function ThemedMosaic(props: React.ComponentProps<typeof Mosaic>) {
  const { colorMode } = useColorMode();
  const themeClass =
    colorMode === 'dark'
      ? 'mosaic-blueprint-theme bp5-dark'
      : 'mosaic-blueprint-theme';
  return (
    <Mosaic
      blueprintNamespace="bp5"
      {...props}
      className={[themeClass, props.className].filter(Boolean).join(' ')}
    />
  );
}

// Add default React imports here so snippets can destructure useState etc.
// Anything referenced by a ```tsx live fence must live in this object.
const ReactLiveScope: Record<string, unknown> = {
  React,
  ...React,
  // Components
  Mosaic: ThemedMosaic,
  MosaicWindow,
  MosaicZeroState,
  MosaicTabs,
  DraggableTab,
  // Toolbar buttons
  Separator,
  ExpandButton,
  RemoveButton,
  ReplaceButton,
  SplitButton,
  AddTabButton,
  TabSplitButton,
  TabRemoveButton,
  TabExpandButton,
  TabDragButton,
  DefaultAddTabButton,
  DefaultToolbarButton,
  // Context
  MosaicContext,
  MosaicWindowContext,
  // Tree utilities
  createBalancedTreeFromLeaves,
  getLeaves,
  getNodeAtPath,
  getParentNode,
  getParentPath,
  isSplitNode,
  isTabsNode,
  // Update helpers
  updateTree,
  createRemoveUpdate,
  createExpandUpdate,
  createHideUpdate,
  createDragToUpdates,
  convertLegacyToNary,
  // Toolbar presets
  DEFAULT_CONTROLS_WITH_CREATION,
  DEFAULT_CONTROLS_WITHOUT_CREATION,
  DEFAULT_CONTROLS_IN_TABS,
  createDefaultTabsControls,
};

export default ReactLiveScope;
