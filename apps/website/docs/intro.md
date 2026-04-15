---
id: intro
title: Getting started
slug: /intro
sidebar_position: 1
---

# react-mosaic

**react-mosaic** is a React tiling window manager. It gives you a drag-to-resize,
drag-to-rearrange layout of panels that users can freely rearrange, inspired by
IDE window management and i3-style tiling.

## Install

```bash
npm install react-mosaic-component react react-dom
```

You'll also want to import the compiled stylesheet in your app's entry point:

```tsx
import 'react-mosaic-component/react-mosaic-component.css';
```

## Quick start

The smallest useful example:

```tsx
import { Mosaic, MosaicWindow } from 'react-mosaic-component';
import 'react-mosaic-component/react-mosaic-component.css';

export function App() {
  return (
    <div style={{ height: '100vh' }}>
      <Mosaic<string>
        renderTile={(id, path) => (
          <MosaicWindow<string> path={path} title={`Panel ${id}`}>
            <div style={{ padding: 20 }}>Contents of {id}</div>
          </MosaicWindow>
        )}
        initialValue={{
          type: 'split',
          direction: 'row',
          children: ['a', 'b'],
        }}
      />
    </div>
  );
}
```

That's three panels' worth of functionality in 15 lines: two tiles side by side,
a draggable divider between them, drag handles on each window title bar to
rearrange, and a default toolbar with split/remove buttons.

## Where to go next

- **[Tree structure](./concepts/tree-structure)** — how layouts are modeled as
  n-ary trees of split, tab, and leaf nodes, with a live example.
- **[Custom toolbars](./guides/custom-toolbar)** — replace the default window
  controls with your own, editable inline.
- **[Demo](/demo)** — the full kitchen-sink demo app showing themes, editable
  tab titles, and programmatic layout actions.
- **API reference** — every public export, generated from source.

## Key features

- **N-ary tree layouts.** A single split can hold any number of children, not
  just two.
- **Tabs as first-class citizens.** Tab containers are a node type, not a
  bolted-on convention.
- **Controlled or uncontrolled.** Pass `value` + `onChange` to manage the tree
  in your own state, or `initialValue` to let the component own it.
- **Drag-and-drop.** Built on `react-dnd` with HTML5 and touch backends.
- **Theming.** Works with or without Blueprint; ships a default CSS theme plus
  CSS variables you can override.
- **Zero-config migration.** Legacy v6 binary trees are converted
  automatically at render time, and [`convertLegacyToNary`](./migration/from-v6)
  is available for explicit upgrades.
