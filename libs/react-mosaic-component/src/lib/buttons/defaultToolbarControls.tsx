import React from 'react';
import { ConnectDragSource } from 'react-dnd';
import { ExpandButton } from './ExpandButton';
import { RemoveButton } from './RemoveButton';
import { ReplaceButton } from './ReplaceButton';
import { SplitButton } from './SplitButton';
import { AddTabButton } from './AddTabButton';
import { TabSplitButton } from './TabSplitButton';
import { TabRemoveButton } from './TabRemoveButton';
import { TabDragButton } from './TabDragButton';
import { DefaultAddTabButton } from './DefaultAddTabButton';
import { MosaicPath } from '../types';

export const DEFAULT_PANEL_CONTROLS_IN_TABS = React.Children.toArray([
  <RemoveButton />,
]);

export const createDefaultTabsControls = (
  path: MosaicPath,
  connectDragSource?: ConnectDragSource,
) =>
  React.Children.toArray([
    ...(connectDragSource
      ? [<TabDragButton connectDragSource={connectDragSource} key="tab-drag-btn" />]
      : []),
    <DefaultAddTabButton path={path} key="tab-add-btn" />,
    <TabSplitButton path={path} key="tab-split-btn" />,
    <TabRemoveButton path={path} key="tab-remove-btn" />,
  ]);

export const DEFAULT_PANEL_CONTROLS_WITH_CREATION = React.Children.toArray([
  <ReplaceButton key="replace-btn" />,
  <SplitButton key="split-btn" />,
  <AddTabButton key="add-tab-btn" />,
  <ExpandButton key="expand-btn" />,
  <RemoveButton key="remove-btn" />,
]);
export const DEFAULT_PANEL_CONTROLS_WITHOUT_CREATION = React.Children.toArray([
  <ExpandButton key="expand-btn" />,
  <RemoveButton key="remove-btn" />,
]);
