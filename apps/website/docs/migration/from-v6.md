---
id: from-v6
title: Migrating from v6
sidebar_position: 1
---

# Migrating from v6

v7 replaced the binary tree layout with an n-ary tree. If you're coming from
v6 or earlier, your layouts still work — `<Mosaic value={legacyTree}>`
normalises the shape on first render — but the modern API is worth adopting.

## What changed

| Concept             | v6 (binary)                              | v7 (n-ary)                                                |
| ------------------- | ---------------------------------------- | --------------------------------------------------------- |
| Split node shape    | `{ direction, first, second }`           | `{ type: 'split', direction, children: [...] }`           |
| Split sizing        | `splitPercentage: number`                | `splitPercentages: number[]` (array sums to 100)          |
| Path representation | `MosaicBranch[]` — `['first', 'second']` | `number[]` — `[0, 1]`                                     |
| Tab support         | None (had to nest splits manually)       | First-class `{ type: 'tabs', tabs, activeTabIndex }` node |
| Max children        | Always 2                                 | Any number per split                                      |

## Legacy tree

```ts
const oldTree = {
  direction: 'row',
  first: 'panel1',
  second: {
    direction: 'column',
    first: 'panel2',
    second: 'panel3',
    splitPercentage: 60,
  },
  splitPercentage: 40,
};
```

## Modern equivalent

```ts
const newTree: MosaicNode<string> = {
  type: 'split',
  direction: 'row',
  splitPercentages: [40, 60],
  children: [
    'panel1',
    {
      type: 'split',
      direction: 'column',
      splitPercentages: [60, 40],
      children: ['panel2', 'panel3'],
    },
  ],
};
```

## `convertLegacyToNary`

If you have a persisted layout in your database that you want to normalise
_before_ hitting `<Mosaic>`, use the conversion helper:

```ts
import { convertLegacyToNary } from 'react-mosaic-component';

const modernTree = convertLegacyToNary(oldTree);
```

This is the same function `<Mosaic>` calls internally, so the result is
guaranteed to be equivalent.

## Automatic conversion

You don't _have_ to migrate anything proactively. `<Mosaic value={oldTree}>`
accepts legacy shapes and converts them on the fly. The recommended workflow:

1. Ship v7 with your existing layouts unchanged — it Just Works.
2. Convert stored layouts lazily: when a user saves, normalise with
   `convertLegacyToNary` so the new shape gets persisted.
3. Once all stored layouts are normalised, delete the legacy branches from
   your codebase.

## Type exports for the transition

The legacy types are still exported for as long as you need them:

```ts
import type {
  MosaicParent,
  MosaicBranch,
  MosaicDirection,
} from 'react-mosaic-component';
```

- `MosaicParent<T>` — the old binary split shape
- `MosaicBranch` — `'first' | 'second'`
- `MosaicDirection` — `'row' | 'column'` (unchanged, re-exported for symmetry)

New code should use `MosaicNode<T>`, `MosaicSplitNode<T>`, and
`MosaicTabsNode<T>` instead.
