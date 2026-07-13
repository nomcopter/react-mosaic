# Architecture

React Mosaic models a layout as an **immutable n-ary tree**. Everything else —
paths, updates, drag & drop — is built on that tree.

## Core concepts

### 1. The tree

```typescript
type MosaicNode<T> = MosaicSplitNode<T> | MosaicTabsNode<T> | T;

interface MosaicSplitNode<T> {
  type: 'split';
  direction: 'row' | 'column';
  children: MosaicNode<T>[];
  splitPercentages?: number[]; // defaults to equal distribution; sums to ~100
}

interface MosaicTabsNode<T> {
  type: 'tabs';
  tabs: T[];
  activeTabIndex: number;
}
```

- **Split node** — divides space between multiple children horizontally or vertically.
- **Tabs node** — stacks children as tabs.
- **Leaf node** — a bare key (`string | number`) identifying a panel.

### 2. Paths

Numeric index arrays that locate a node: `[]` is the root, `[0]` the first child,
`[1, 2]` the third child of the second child. Path operations are O(depth).

### 3. Immutability

Every update returns a **new** tree instance — never mutate in place, or the UI
won't reflect the change. Go through the utilities below.

### 4. Type guards

Narrow with `isSplitNode(node)` and `isTabsNode(node)` before touching
node-specific fields. Anything else is a leaf.

### 5. Drag & drop

Built on `react-dnd` with an HTML5 backend (desktop), a touch backend (mobile),
and automatic multi-backend switching. `Mosaic` sets up the DnD provider itself.

## Key files

| File                                          | Role                                                         |
| --------------------------------------------- | ------------------------------------------------------------ |
| `src/index.ts`                                | Public API — the single source of truth for what's exported  |
| `src/lib/Mosaic.tsx`                          | Root component; controlled/uncontrolled state; DnD context   |
| `src/lib/MosaicRoot.tsx`                      | Recursive tree renderer; legacy→n-ary conversion             |
| `src/lib/MosaicWindow.tsx`                    | Window wrapper — title bar, toolbar, drag handle             |
| `src/lib/MosaicTabs.tsx` / `DraggableTab.tsx` | Tab container and draggable tabs                             |
| `src/lib/Split.tsx`                           | Resizable divider between split children                     |
| `src/lib/types.ts`                            | Public types (`MosaicNode`, `MosaicPath`, `MosaicUpdate`, …) |
| `src/lib/contextTypes.ts`                     | `MosaicContext` / `MosaicWindowContext` and their actions    |
| `src/lib/util/mosaicUtilities.ts`             | Tree reads, type guards, balancing, legacy conversion        |
| `src/lib/util/mosaicUpdates.ts`               | Tree mutations                                               |

All paths are under `libs/react-mosaic-component/`.

## Utilities (prefer these over hand-rolled traversal — they handle edge cases)

**`mosaicUtilities.ts`** — `isSplitNode`, `isTabsNode`, `getNodeAtPath`,
`getParentNode`, `getLeaves`, `createBalancedTreeFromLeaves`, `convertLegacyToNary`.

**`mosaicUpdates.ts`** — `updateTree(tree, updates)`, `createRemoveUpdate(path)`,
`createExpandUpdate(path, %)`, `createHideUpdate(path)`,
`createDragToUpdates(tree, source, destination, position)`.

```typescript
import {
  updateTree,
  createRemoveUpdate,
  isSplitNode,
} from 'react-mosaic-component';

const newTree = updateTree(currentTree, [createRemoveUpdate(path)]);
if (isSplitNode(node)) {
  /* node is MosaicSplitNode<T> here */
}
```

## Consuming the components

**`<Mosaic>`** — `renderTile` (required); `initialValue` (uncontrolled) **or**
`value` (controlled); `onChange`, `onRelease`, `className`, `blueprintNamespace`,
`createNode`, `resize`, `zeroStateView`.

**`<MosaicWindow>`** — `path` (required), `title`; `className`, `toolbarControls`,
`draggable`, `createNode`, `onDragStart`, `onDragEnd`.

**Context actions** — don't manipulate the tree directly; call actions:

```typescript
const { mosaicActions } = useContext(MosaicContext);
mosaicActions.remove(path);
mosaicActions.expand(path);
mosaicActions.hide(path); // transient (drag-lifecycle) — never fires onRelease

const { mosaicWindowActions } = useContext(MosaicWindowContext);
mosaicWindowActions.split();
mosaicWindowActions.getPath();
```

## Theming

```tsx
import '@blueprintjs/core/lib/css/blueprint.css';
import '@blueprintjs/icons/lib/css/blueprint-icons.css';
import 'react-mosaic-component/react-mosaic-component.css';

<Mosaic className="mosaic-blueprint-theme" blueprintNamespace="bp5" />;
// dark mode: className="mosaic-blueprint-theme bp5-dark"
```

Blueprint is optional. Customize with the `--mosaic-border` CSS variable on
`.mosaic-window`, and supply a custom toolbar via `MosaicWindow`'s
`toolbarControls` (compose from exported buttons like `RemoveButton`,
`SplitButton`).

## Performance

- Degrades past ~1000 panels; avoid tree nesting deeper than ~10 levels.
- `React.memo` tile components; keep callbacks stable (`useCallback`).
- Throttle drag/resize — never update the tree on every mouse-move.

## Legacy migration (v6 → v7)

v7 replaced binary trees with n-ary ones. `first`/`second` → `children[]`,
string paths → numeric paths, `splitPercentage` → `splitPercentages[]`.
`MosaicRoot` auto-runs `convertLegacyToNary` on legacy input.
