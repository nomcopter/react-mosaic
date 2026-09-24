---
name: react-mosaic
description: Build tiling window manager layouts in React with react-mosaic-component (v7) - resizable, drag-and-drop rearrangeable panels, splits and tab groups. Use when writing or changing code that imports react-mosaic-component, uses Mosaic / MosaicWindow / MosaicNode, or when asked for an IDE-like, dockable, resizable or tiled panel layout in React.
---

# react-mosaic-component (v7)

A React tiling window manager (React 16-19, TypeScript). The layout is an
**immutable n-ary tree** of panels. Full docs: https://nomcopter.github.io/react-mosaic/

**v7 is not v6.** Most examples online (and in older training data) use the v6
binary tree (`first` / `second`, `splitPercentage`, string paths like
`['first']`). That shape is legacy. Write v7 code as shown here.

## Setup

```bash
npm install react-mosaic-component
```

```tsx
import 'react-mosaic-component/react-mosaic-component.css'; // required
```

`<Mosaic>` fills its parent, so the parent **must have a real height**
(e.g. `height: 100vh`), otherwise nothing is visible.

## Minimal example

```tsx
import { Mosaic, MosaicWindow, type MosaicNode } from 'react-mosaic-component';
import 'react-mosaic-component/react-mosaic-component.css';

const initial: MosaicNode<string> = {
  type: 'split',
  direction: 'row', // 'row' = side by side, 'column' = stacked
  splitPercentages: [30, 70], // optional, sums to 100
  children: [
    'files',
    { type: 'split', direction: 'column', children: ['editor', 'terminal'] },
  ],
};

export function App() {
  return (
    <div style={{ height: '100vh' }}>
      <Mosaic<string>
        initialValue={initial}
        renderTile={(id, path) => (
          <MosaicWindow<string> path={path} title={id}>
            <Panel id={id} />
          </MosaicWindow>
        )}
      />
    </div>
  );
}
```

`renderTile(key, path)` is called for every leaf. Pass the `path` it gives you
straight to `MosaicWindow`; never compute paths yourself.

## The tree

```ts
type MosaicKey = string | number; // a leaf is just its key
type MosaicNode<T> = MosaicSplitNode<T> | MosaicTabsNode<T> | T;

interface MosaicSplitNode<T> {
  type: 'split';
  direction: 'row' | 'column';
  children: MosaicNode<T>[]; // any number of children
  splitPercentages?: number[]; // one per child, sums to 100; omit for equal sizes
}

interface MosaicTabsNode<T> {
  type: 'tabs';
  tabs: T[]; // leaf keys only, tab groups don't nest
  activeTabIndex: number;
}
```

- A bare key (`'editor'`) is a valid whole tree: one full-size window.
- `null` is an empty layout; `zeroStateView` is shown.
- Keys must be unique in the tree. They are your IDs: map them to content in
  `renderTile`, don't put components or objects in the tree. Keep the tree
  JSON-serialisable so it can be persisted.
- **Paths** are numeric index arrays: `[]` is the root, `[1, 0]` is the first
  child of the second child. For a tab group, the active tab's path is the
  group's path plus the tab index.
- Narrow with `isSplitNode(node)` / `isTabsNode(node)`; anything else is a leaf.

## Controlled vs uncontrolled

Use **either** `initialValue` (Mosaic owns the state) **or** `value` +
`onChange` (you own it). Never both. Go controlled whenever you persist the
layout or change it from outside.

```tsx
const [tree, setTree] = useState<MosaicNode<string> | null>(initial);

<Mosaic<string>
  value={tree}
  onChange={setTree} // every change, including each frame of a resize drag
  onRelease={(next) => save(next)} // once per finished interaction: persist here
  renderTile={renderTile}
/>;
```

Both callbacks get a second `meta` argument describing the change, e.g.
`{ type: 'remove', path, node }`, `{ type: 'resize', path, splitPercentages }`,
`{ type: 'drop', node, sourcePath, destinationPath, position?, tabIndex?, swap? }`,
`{ type: 'tab-add' | 'tab-remove' | 'tab-select', ... }`. Paths in `meta`
refer to the tree **before** the change. See `MosaicChangeMeta`.

## Changing the tree

Never mutate a tree in place; the UI won't update. Two ways to change it:

**Inside the mosaic** (toolbar buttons, tile content), use the context actions:

```tsx
import { useMosaic, useMosaicWindow } from 'react-mosaic-component';

function CloseButton({ path }: { path: MosaicPath }) {
  const { mosaicActions } = useMosaic<string>();
  return <button onClick={() => mosaicActions.remove(path)}>Close</button>;
}
// mosaicActions: remove(path), expand(path, pct?), replaceWith(path, node),
//   updateTree(updates), addTab(path), removeTab(path, index), getRoot()
// useMosaicWindow().mosaicWindowActions: split(), addTab(), replaceWithNew(),
//   getPath(), setAdditionalControlsOpen(open | 'toggle'), connectDragSource(el)
```

`split()`, `addTab()` and `replaceWithNew()` need the `createNode` prop (on
`Mosaic` or `MosaicWindow`), which returns the new node (or a promise of one).

**Outside the mosaic** (controlled mode), compute a new tree and `setTree` it:

```ts
import {
  updateTree,
  createRemoveUpdate,
  createExpandUpdate,
} from 'react-mosaic-component';

setTree((t) => (t ? updateTree(t, [createRemoveUpdate(t, [1, 0])]) : t));
```

Helpers (all pure, return new objects):

| Helper                                                        | Use                                                                               |
| ------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `updateTree(tree, updates)`                                   | apply `MosaicUpdate[]` (`{ path, spec }`, spec is an immutability-helper command) |
| `createRemoveUpdate(tree, path)`                              | remove a node, collapsing its parent                                              |
| `createExpandUpdate(path, percentage)`                        | grow a node at every level up to the root                                         |
| `createSwapUpdates(tree, pathA, pathB)`                       | swap two nodes (returns an array)                                                 |
| `createDragToUpdates(tree, source, dest, dropInfo)`           | what a drag does, e.g. `{ type: 'split', position: 'left' }` (returns an array)   |
| `getNodeAtPath(tree, path)`, `getParentNode`, `getParentPath` | reads                                                                             |
| `getLeaves(tree)`                                             | all leaf keys, e.g. to check if a panel is open                                   |
| `createBalancedTreeFromLeaves(keys, 'row')`                   | build a layout from a list of keys                                                |
| `convertLegacyToNary(tree)`                                   | convert a stored v6 tree                                                          |

To add a panel from outside, the simplest correct approach is to rebuild:
`createBalancedTreeFromLeaves([...getLeaves(tree), 'new'])`, or wrap the root:
`{ type: 'split', direction: 'row', children: [tree, 'new'] }`.

## MosaicWindow

```tsx
<MosaicWindow<string>
  path={path} // required, from renderTile
  title="Editor" // required
  toolbarControls={[<SplitButton key="s" />, <RemoveButton key="r" />]} // replaces default buttons
  createNode={() => nextId()}
  draggable // default true; false disables dragging by the title bar
  renderToolbar={(props, draggable) => <MyToolbar />} // optional: replace the whole title bar
>
  ...
</MosaicWindow>
```

Toolbar building blocks: `ExpandButton`, `SplitButton`, `ReplaceButton`,
`RemoveButton`, `Separator`, `DefaultToolbarButton`,
`DEFAULT_CONTROLS_WITH_CREATION`, `DEFAULT_CONTROLS_WITHOUT_CREATION`.
Using `MosaicWindow` is optional: `renderTile` can return any element.

## Tabs

Put a `{ type: 'tabs', tabs: ['a', 'b'], activeTabIndex: 0 }` node anywhere a
leaf can go. `renderTile` is called only for the active tab. Tab-related
`Mosaic` props: `canClose(tabKey, tabs, index, path)` returning
`'canClose' | 'cannotClose' | 'noClose'`, `renderTabTitle`, `renderTabButton`,
`renderTabToolbarControls` (compose `DefaultAddTabButton`, `TabSplitButton`,
`TabRemoveButton`), and `renderTabToolbar` for a fully custom tab bar.

## Other Mosaic props

- `resize`: `'DISABLED'` or `{ minimumPaneSizePercentage?, minimumPaneSizePx?, renderSplitHandle?, preview? }`.
  `preview: true` only moves the divider while dragging and resizes once on release.
- `dropBehavior`: `'split'` (default), `'swap'`, or `'split-and-swap'`.
- `zeroStateView`: element shown when the tree is `null`.
- `className`: default `'mosaic-blueprint-theme'`. Blueprint is optional; for
  Blueprint dark mode use `'mosaic-blueprint-theme bp5-dark'` and load
  Blueprint's CSS. With your own theme, pass your own class name.
- `mosaicId`: set a fixed one when external drag sources must drop into the layout.

## Drag and drop

`Mosaic` sets up react-dnd itself (HTML5 + touch). If the app already has a
`DndProvider`, render `MosaicWithoutDragDropContext` (same props) inside it
instead of nesting a second provider, and share one copy of `react-dnd` 16.
External drops use drag type `MosaicDragType.WINDOW`; drop targets outside the
layout can return `{ remove: true }` to take the dragged window out. Docs:
https://nomcopter.github.io/react-mosaic/docs/guides/drag-and-drop

## Common mistakes

- v6 shapes: `{ direction, first, second }`, `splitPercentage`, `['first']`
  paths. Use `type: 'split'`, `children`, `splitPercentages`, numeric paths.
- Forgetting the CSS import, or a parent with no height.
- Passing both `value` and `initialValue`, or `value` without `onChange`.
- Mutating the tree (`tree.children.push(...)`) instead of returning a new one.
- Saving on every `onChange` during a resize drag; persist in `onRelease`.
- `splitPercentages` whose length differs from `children` or doesn't sum to 100.
- Duplicate keys in the tree, or nesting a tabs node inside `tabs`.
- Hand-writing paths instead of using the `path` from `renderTile` /
  `useMosaicWindow().mosaicWindowActions.getPath()`.

The TypeScript declarations in this package (`index.d.ts`) are the source of
truth for every signature.
