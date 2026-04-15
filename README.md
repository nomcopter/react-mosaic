[![NPM Version](https://img.shields.io/npm/v/react-mosaic-component.svg)](https://www.npmjs.com/package/react-mosaic-component)
[![React](https://img.shields.io/badge/React-16%20%7C%2017%20%7C%2018%20%7C%2019-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)

<p style="text-align: center;">

> **A powerful React Tiling Window Manager for building sophisticated, user-controlled interfaces**

React Mosaic is a full-featured React component library that provides complete control over complex workspace layouts. Built with TypeScript, it offers a flexible API for creating tiled interfaces that users can dynamically resize, rearrange, and customize.
<picture>
<img alt="React Mosaic" src="./apps/demo-app/public/favicon.svg" width="64px">
</picture>

</p>

**🚀 [Live Demo](https://nomcopter.github.io/react-mosaic/) | [Documentation](https://github.com/nomcopter/react-mosaic)**

## ✨ Features

- 🎯 **N-ary Tree Structure**: Support for complex layouts with multiple panels and tabs
- 🎨 **Drag & Drop**: Intuitive drag-and-drop interface for rearranging panels
- 📱 **Responsive**: Works seamlessly on desktop and touch devices
- 🎭 **Themeable**: Built-in Blueprint theme support with dark mode
- 💪 **TypeScript**: Full TypeScript support with comprehensive type definitions
- 📦 **ESM & CJS Support**: Available as both ES Modules and CommonJS for maximum compatibility
- 🔧 **Extensible**: Customizable toolbar buttons and controls
- 📚 **Well Documented**: Comprehensive API documentation and examples

#### Screencast

[![screencast demo](./screencast.gif)](./screencast.gif)

## 🚀 Quick Start

### Installation

```bash
# Using npm
npm install react-mosaic-component

# Using yarn
yarn add react-mosaic-component

# Using pnpm
pnpm add react-mosaic-component
```

### Basic Setup

1. Install the package
2. Import the CSS file: `import 'react-mosaic-component/react-mosaic-component.css'`
3. (Optional) Install Blueprint for theming: `npm install @blueprintjs/core @blueprintjs/icons`

### Simple Example

```tsx
import React from 'react';
import { Mosaic, MosaicWindow } from 'react-mosaic-component';
import 'react-mosaic-component/react-mosaic-component.css';

// Optional: Add Blueprint theme
import '@blueprintjs/core/lib/css/blueprint.css';
import '@blueprintjs/icons/lib/css/blueprint-icons.css';

export type ViewId = 'a' | 'b' | 'c';

const TITLE_MAP: Record<ViewId, string> = {
  a: 'Left Panel',
  b: 'Top Right Panel',
  c: 'Bottom Right Panel',
};

export const MyApp = () => (
  <div style={{ height: '100vh', width: '100vw' }}>
    <Mosaic<ViewId>
      renderTile={(id, path) => (
        <MosaicWindow<ViewId>
          path={path}
          createNode={() => 'new' as ViewId}
          title={TITLE_MAP[id]}
        >
          <div style={{ padding: '20px' }}>
            <h2>{TITLE_MAP[id]}</h2>
            <p>This is the content for {id}</p>
          </div>
        </MosaicWindow>
      )}
      initialValue={{
        type: 'split',
        direction: 'row',
        splitPercentages: [40, 60],
        children: [
          'a',
          {
            type: 'split',
            direction: 'column',
            splitPercentages: [50, 50],
            children: ['b', 'c'],
          },
        ],
      }}
      className="mosaic-blueprint-theme"
      blueprintNamespace="bp5"
    />
  </div>
);
```

## 📖 Documentation

### Core Concepts

#### 🌳 Tree Structure

React Mosaic uses an n-ary tree structure to represent layouts:

- **Split Nodes**: Container nodes that divide space between children
- **Tab Nodes**: Container nodes that stack children in tabs
- **Leaf Nodes**: Individual panels identified by unique keys

```typescript
type MosaicNode<T> = MosaicSplitNode<T> | MosaicTabsNode<T> | T;

interface MosaicSplitNode<T> {
  type: 'split';
  direction: 'row' | 'column';
  children: MosaicNode<T>[];
  splitPercentages?: number[];
}

interface MosaicTabsNode<T> {
  type: 'tabs';
  tabs: T[];
  activeTabIndex: number;
}
```

#### 🛣️ Paths

Paths in Mosaic are arrays of numbers representing the route to a node:

- `[]` - Root node
- `[0]` - First child of root
- `[1, 2]` - Third child of second child of root

### API Reference

#### Mosaic Component

```typescript
interface MosaicProps<T> {
  // Required
  renderTile: (id: T, path: MosaicPath) => ReactElement;

  // State Management (use one or the other)
  initialValue?: MosaicNode<T> | null; // Uncontrolled
  value?: MosaicNode<T> | null; // Controlled

  // Event Handlers
  onChange?: (newNode: MosaicNode<T> | null) => void;
  onRelease?: (newNode: MosaicNode<T> | null) => void;

  // Styling & Theming
  className?: string;
  blueprintNamespace?: string;

  // Functionality
  createNode?: CreateNode<T>;
  resize?: ResizeOptions;
  zeroStateView?: ReactElement;

  // Tabs customisation
  renderTabTitle?: TabTitleRenderer<T>;
  renderTabButton?: TabButtonRenderer<T>;
  renderTabToolbar?: TabToolbarRenderer<T>;
  canClose?: TabCanCloseFunction<T>;

  // Drag & Drop
  dragAndDropManager?: DragDropManager;
  mosaicId?: string;
}
```

#### MosaicWindow Component

```typescript
interface MosaicWindowProps<T> {
  // Required
  title: string;
  path: MosaicPath;

  // Styling
  className?: string;

  // Controls
  toolbarControls?: ReactNode;
  additionalControls?: ReactNode;
  additionalControlButtonText?: string;

  // Behavior
  draggable?: boolean;
  createNode?: CreateNode<T>;

  // Event Handlers
  onDragStart?: () => void;
  onDragEnd?: (type: 'drop' | 'reset') => void;
  onAdditionalControlsToggle?: (open: boolean) => void;

  // Customization
  renderPreview?: (props: MosaicWindowProps<T>) => ReactElement;
  renderToolbar?: (props: MosaicWindowProps<T>) => ReactElement;

  // Advanced
  disableAdditionalControlsOverlay?: boolean;
}
```

## 🎨 Theming

### Blueprint Theme (Recommended)

React Mosaic includes built-in support for the Blueprint design system:

```tsx
import '@blueprintjs/core/lib/css/blueprint.css';
import '@blueprintjs/icons/lib/css/blueprint-icons.css';

<Mosaic
  className="mosaic-blueprint-theme"
  blueprintNamespace="bp5" // Latest Blueprint version
  // ... other props
/>;
```

### Dark Theme

Enable Blueprint's dark theme:

```tsx
<Mosaic
  className="mosaic-blueprint-theme bp5-dark"
  // ... other props
/>
```

### Custom Themes

Create your own themes by styling the CSS classes:

```css
.my-custom-theme {
  --mosaic-window-border: 1px solid #e1e8ed;
  --mosaic-window-background: #ffffff;
  --mosaic-toolbar-background: #f5f8fa;
}

.my-custom-theme .mosaic-window {
  border: var(--mosaic-window-border);
  background: var(--mosaic-window-background);
}

.my-custom-theme .mosaic-window-toolbar {
  background: var(--mosaic-toolbar-background);
}
```

## 📝 Advanced Examples

### Controlled Component

```tsx
import React, { useState } from 'react';
import { Mosaic, MosaicNode } from 'react-mosaic-component';

const ControlledExample = () => {
  const [currentNode, setCurrentNode] = useState<MosaicNode<string> | null>({
    type: 'split',
    direction: 'row',
    splitPercentages: [50, 50],
    children: ['panel1', 'panel2'],
  });

  const handleAddPanel = () => {
    setCurrentNode({
      type: 'split',
      direction: 'column',
      splitPercentages: [70, 30],
      children: [currentNode!, 'new-panel'],
    });
  };

  return (
    <div>
      <button onClick={handleAddPanel}>Add Panel</button>
      <Mosaic<string>
        value={currentNode}
        onChange={setCurrentNode}
        renderTile={(id, path) => (
          <MosaicWindow title={id} path={path}>
            <div>Content for {id}</div>
          </MosaicWindow>
        )}
      />
    </div>
  );
};
```

### Custom Toolbar Controls

```tsx
import {
  RemoveButton,
  SplitButton,
  ExpandButton,
  Separator,
} from 'react-mosaic-component';

const customControls = (
  <>
    <SplitButton />
    <ExpandButton />
    <Separator />
    <RemoveButton />
    <button
      className="mosaic-default-control"
      onClick={() => console.log('Custom action')}
    >
      Custom
    </button>
  </>
);

<MosaicWindow title="My Panel" path={path} toolbarControls={customControls}>
  {/* Panel content */}
</MosaicWindow>;
```

### Tab Groups

```tsx
const tabsExample: MosaicNode<string> = {
  type: 'tabs',
  tabs: ['tab1', 'tab2', 'tab3'],
  activeTabIndex: 0,
};

<Mosaic
  initialValue={tabsExample}
  renderTile={(id, path) => (
    <div style={{ padding: '20px' }}>
      <h3>Tab Content: {id}</h3>
      <p>This is content for {id}</p>
    </div>
  )}
  renderTabTitle={({ tabKey, isActive }) => (
    <span style={{ fontWeight: isActive ? 'bold' : 'normal' }}>
      📄 {String(tabKey).toUpperCase()}
    </span>
  )}
/>;
```

### Complex Layout with Mixed Content

```tsx
const complexLayout: MosaicNode<string> = {
  type: 'split',
  direction: 'column',
  splitPercentages: [30, 70],
  children: [
    {
      type: 'tabs',
      tabs: ['overview', 'settings', 'help'],
      activeTabIndex: 0,
    },
    {
      type: 'split',
      direction: 'row',
      splitPercentages: [60, 40],
      children: [
        'main-content',
        {
          type: 'split',
          direction: 'column',
          splitPercentages: [50, 50],
          children: ['sidebar1', 'sidebar2'],
        },
      ],
    },
  ],
};
```

## 🔧 Utilities & Tree Manipulation

### Working with Trees

```tsx
import {
  getLeaves,
  createBalancedTreeFromLeaves,
  updateTree,
  createRemoveUpdate,
  createExpandUpdate,
  createHideUpdate,
  createDragToUpdates,
  getNodeAtPath,
  getParentNode,
  getParentPath,
  isSplitNode,
  isTabsNode,
  convertLegacyToNary,
} from 'react-mosaic-component';

// Get all leaf nodes (panel IDs)
const leaves = getLeaves(currentTree);
console.log('Panel IDs:', leaves); // ['panel1', 'panel2', 'panel3']

// Create a balanced layout from panels
const balancedTree = createBalancedTreeFromLeaves(leaves);

// Remove a node at a specific path
const removeUpdate = createRemoveUpdate([1, 0]); // Remove first child of second child
const newTree = updateTree(currentTree, [removeUpdate]);

// Expand a node to take more space
const expandUpdate = createExpandUpdate([0], 80); // Expand first child to 80%
const expandedTree = updateTree(currentTree, [expandUpdate]);

// Get a specific node
const nodeAtPath = getNodeAtPath(currentTree, [1, 0]);
```

### Context API

Access Mosaic's context in child components:

```tsx
import { useContext } from 'react';
import { MosaicWindowContext } from 'react-mosaic-component';

const MyCustomComponent = () => {
  const { mosaicActions, mosaicWindowActions } =
    useContext(MosaicWindowContext);

  const handleSplit = async () => {
    await mosaicWindowActions.split();
  };

  const handleRemove = () => {
    const path = mosaicWindowActions.getPath();
    mosaicActions.remove(path);
  };

  return (
    <div>
      <button onClick={handleSplit}>Split Window</button>
      <button onClick={handleRemove}>Remove Window</button>
    </div>
  );
};
```

## 📚 Complete API Reference

The sections above cover the most common workflows. This appendix lists every public
export so you can find the right import without spelunking through the source.

### Components

| Export                                                | Purpose                                                                                                                   |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `Mosaic`                                              | Top-level tiling component. Handles drag-and-drop context.                                                                |
| `MosaicWithoutDragDropContext`                        | Same as `Mosaic` but without wrapping a `DndProvider`, for apps that already own the react-dnd context.                   |
| `MosaicWindow`                                        | Window wrapper with title bar, toolbar, and drag handle.                                                                  |
| `MosaicTabs`                                          | Tabbed container used internally for `MosaicTabsNode`. Exported so you can render it yourself from a custom `renderTile`. |
| `MosaicZeroState`                                     | Default "no windows" view. Accepts `createNode` to offer an "Add New Window" button.                                      |
| `DraggableTab`                                        | Low-level draggable tab primitive used inside custom `renderTabToolbar` implementations.                                  |
| `DefaultToolbarButton` / `createDefaultToolbarButton` | Styled button factory matching the default toolbar look.                                                                  |

### Toolbar button exports

Panel (split) buttons:

- `ExpandButton`, `RemoveButton`, `ReplaceButton`, `SplitButton`, `AddTabButton`, `Separator`

Tab-group buttons (rendered inside a `MosaicTabsNode`):

- `TabSplitButton`, `TabRemoveButton`, `TabExpandButton`, `TabDragButton`

Presets you can spread into `toolbarControls` / `tabToolbarControls`:

```tsx
import {
  DEFAULT_CONTROLS_WITH_CREATION, // Replace, Split, AddTab, Expand, Remove
  DEFAULT_CONTROLS_WITHOUT_CREATION, // Expand, Remove
  DEFAULT_CONTROLS_IN_TABS, // Remove (for panels nested inside a tab group)
  createDefaultTabsControls, // (path, connectDragSource?) => [TabDrag, TabSplit, TabRemove]
} from 'react-mosaic-component';
```

### Renderer / callback types

All are generic in the panel key type `T`:

| Type                     | Signature                                                                                                                                        |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `TileRenderer<T>`        | `(id: T, path: MosaicPath) => ReactElement`                                                                                                      |
| `TabTitleRenderer<T>`    | `(props: { tabKey: T; index: number; isActive: boolean; path: MosaicPath; mosaicId: string }) => ReactNode`                                      |
| `TabButtonRenderer<T>`   | `(props: { tabKey, index, isActive, path, mosaicId, onTabClick, mosaicActions, renderTabTitle?, canClose?, onTabClose?, tabs }) => ReactElement` |
| `TabToolbarRenderer<T>`  | `(props: { tabs: T[]; activeTabIndex: number; path: MosaicPath; DraggableTab }) => ReactElement`                                                 |
| `TabCanCloseFunction<T>` | `(tabKey: T, tabs: T[], index: number, path: MosaicPath) => TabCloseState`                                                                       |
| `TabCloseState`          | `'canClose' \| 'cannotClose' \| 'noClose'`                                                                                                       |
| `CreateNode<T>`          | `(...args: any[]) => MosaicNode<T> \| Promise<MosaicNode<T>>`                                                                                    |
| `MosaicUpdate<T>`        | `{ path: MosaicPath; spec: MosaicUpdateSpec<T> }`                                                                                                |
| `MosaicUpdateSpec<T>`    | `Spec<MosaicNode<T>>` (from `immutability-helper`)                                                                                               |
| `MosaicDragType`         | `{ WINDOW: 'MosaicWindow' }` — the react-dnd drag type constant                                                                                  |

### Tree utilities (`mosaicUtilities`)

```tsx
isSplitNode(node)          // type guard for MosaicSplitNode<T>
isTabsNode(node)           // type guard for MosaicTabsNode<T>
getLeaves(tree)            // flatten tree to an array of panel keys
getNodeAtPath(tree, path)  // node at path, or null
getAndAssertNodeAtPathExists(tree, path)  // like above, throws on miss
getParentNode(tree, path)  // parent node, or null if path is root
getParentPath(path)        // path.slice(0, -1)
getPathToCorner(tree, corner) // path to a given Corner (TOP_LEFT, TOP_RIGHT, BOTTOM_LEFT, BOTTOM_RIGHT)
getOtherDirection(direction)  // 'row' <-> 'column'
createBalancedTreeFromLeaves(leaves, startDirection?) // build a balanced split tree
convertLegacyToNary(legacyNode)   // upgrade a v0.19 binary tree to the n-ary format
```

### Tree update helpers (`mosaicUpdates`)

```tsx
updateTree(tree, updates); // apply an array of MosaicUpdate<T>
buildSpecFromUpdate(update); // low-level spec builder
createRemoveUpdate(path); // remove node at path
createHideUpdate(tree, path); // collapse a pane to 0% without removing it
createExpandUpdate(path, percentage); // grow a pane toward `percentage`
createDragToUpdates(tree, sourcePath, destinationPath, dropInfo);
// dropInfo is one of:
//   { type: 'split', position: MosaicDropTargetPosition }
//   { type: 'tab-container' }
//   { type: 'tab-reorder', insertIndex: number }
```

`createDragToUpdates` is what powers drag-drop inside the library — reach for it if you're
implementing programmatic "move panel here" actions from outside the drag layer.

### Legacy (v0.19) types

If you're migrating an older layout, these re-exports accept the old binary-tree shape:

```tsx
import {
  convertLegacyToNary,
  LegacyMosaicNode,
  LegacyMosaicParent,
  LegacyMosaicKey,
  LegacyMosaicDirection,
  LegacyMosaicBranch,
  LegacyMosaicPath,
} from 'react-mosaic-component';

const naryTree = convertLegacyToNary(oldBinaryTree);
```

`<Mosaic value={...}>` also accepts legacy nodes directly and normalises them on first
render, so the explicit conversion is only needed when you want to hold the upgraded
shape in your own state.

## 🏗️ Development

### Requirements

- Node.js 18+
- npm/yarn/pnpm
- React 16-19

### Setup

```bash
# Clone the repository
git clone https://github.com/nomcopter/react-mosaic.git
cd react-mosaic

# Install dependencies
npm install

# Start development server
npm start

# Run tests
npm test

# Build library
npm run build:lib
```

### Project Structure

```
react-mosaic/
├── apps/
│   └── demo-app/          # Demo application
├── libs/
│   └── react-mosaic-component/  # Main library
├── test/                  # Test files
├── docs/                  # Documentation
└── tools/                 # Build tools
```

## 🤝 Contributing

We welcome contributions! Here's how to get started:

### Development Workflow

1. **Fork** the repository
2. **Clone** your fork: `git clone https://github.com/nomcopter/react-mosaic.git`
3. **Create** a feature branch: `git checkout -b feature/amazing-feature`
4. **Install** dependencies: `npm install` (this automatically sets up Git hooks via lefthook)
5. **Make** your changes
6. **Add** tests for new functionality
7. **Run** the test suite: `npm test`
8. **Lint** your code: `npm run lint`
9. **Commit** your changes following [Conventional Commits](https://www.conventionalcommits.org/):
   ```bash
   git commit -m "feat: add amazing feature"
   # or
   git commit -m "fix: resolve bug in component"
   ```
10. **Push** to your branch: `git push origin feature/amazing-feature`
11. **Submit** a pull request

### Commit Message Format

This project enforces **Conventional Commits** for automatic changelog generation. All commits must follow this format:

```
<type>(<scope>): <subject>

Examples:
feat: add support for custom toolbar buttons
fix(drag-drop): prevent memory leak on unmount
docs: update installation instructions
```

**Allowed types:** `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`

Commit messages are validated by lefthook Git hooks locally and in CI. Invalid commits will be rejected automatically.

See [CONTRIBUTING.md](./CONTRIBUTING.md) for detailed guidelines.

### Code Style

This project uses:

- **ESLint** for code linting
- **Prettier** for code formatting
- **TypeScript** for type checking
- **lefthook** for Git hooks management

Run these commands to ensure code quality:

```bash
npm run lint        # Check linting
npm run format      # Format code with Prettier
npm test            # Run tests
```

### Guidelines

- Follow the existing code style
- Write tests for new features
- Update documentation as needed
- Keep pull requests focused and small
- Use Conventional Commits format for all commits

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- --testNamePattern="Mosaic"
```

## 📦 Building

```bash
# Build the library
npm run build:lib

# Build the demo app
npm run build:app

# Build everything
npm run build

# Build and watch for changes
npm run build:watch
```

## 🚀 Deployment

The demo app is automatically deployed to GitHub Pages when changes are pushed to the main branch.

To deploy manually:

```bash
npm run build:app
npm run deploy
```

## 🐛 Browser Support

| Browser | Version |
| ------- | ------- |
| Chrome  | 90+     |
| Firefox | 88+     |
| Safari  | 14+     |
| Edge    | 90+     |

## 📋 Migration Guide

### From `react-mosaic-component` to `react-mosaic-component`

Version 1 introduces significant changes with n-ary tree support:

**Tree Structure Changes:**

- Binary trees (`first`/`second`) → N-ary trees (`children` array)
- `splitPercentage` → `splitPercentages` array
- New tab node type: `MosaicTabsNode`

**Path Changes:**

- String paths (`['first', 'second']`) → Numeric paths (`[0, 1]`)

**Type Changes:**

Replace deprecated types with new ones:

```typescript
// OLD: Deprecated types
import {
  MosaicBranch, // ❌ Use numeric indices instead
  MosaicParent, // ❌ Use MosaicSplitNode instead
  MosaicNode, // ✅ Still valid but structure changed
} from 'react-mosaic-component';

// NEW: Updated types
import {
  MosaicSplitNode, // ✅ Replaces MosaicParent
  MosaicTabsNode, // ✅ New tab container type
  MosaicNode, // ✅ Union of split, tabs, or leaf
  MosaicPath, // ✅ Now number[] instead of string[]
  // Helper functions for type checking
  isSplitNode,
  isTabsNode,
  convertLegacyToNary, // ✅ Migration utility
} from 'react-mosaic-component';
```

**Migration Steps:**

1. **Update Type Checking Logic:**

```typescript
// OLD: Manual type checking
if ('first' in node && 'second' in node) {
  // Handle parent node
  const leftChild = node.first;
  const rightChild = node.second;
}

// NEW: Use helper functions
import { isSplitNode, isTabsNode } from 'react-mosaic-component';

if (isSplitNode(node)) {
  // Handle split node with multiple children
  node.children.forEach((child, index) => {
    // Process each child
  });
} else if (isTabsNode(node)) {
  // Handle tab container
  node.tabs.forEach((tab, index) => {
    // Process each tab
  });
} else {
  // Handle leaf node (panel)
  console.log('Panel ID:', node);
}
```

2. **Update Path Handling:**

```typescript
// OLD: String-based paths
const oldPath: MosaicBranch[] = ['first', 'second'];
const childPath = [...parentPath, 'first'];

// NEW: Numeric paths
const newPath: MosaicPath = [0, 1];
const childPath = [...parentPath, 0]; // First child
```

3. **Use Migration Utility for Existing Data:**

```typescript
import { convertLegacyToNary } from 'react-mosaic-component';

// Convert old tree structure to new format
const legacyTree = {
  direction: 'row',
  first: 'panel1',
  second: 'panel2',
  splitPercentage: 40,
};

const modernTree = convertLegacyToNary(legacyTree);
// Result: { type: 'split', direction: 'row', children: ['panel1', 'panel2'], splitPercentages: [40, 60] }
```

**Complete Migration Example:**

```typescript
// Old v6 structure
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

// New structure
const newTree = {
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

// Or use the conversion utility
const convertedTree = convertLegacyToNary(oldTree);
```

**Working with the New Tree Structure:**

```typescript
import {
  MosaicNode,
  MosaicSplitNode,
  MosaicTabsNode,
  isSplitNode,
  isTabsNode,
  getNodeAtPath,
  getLeaves,
} from 'react-mosaic-component';

// Type-safe tree traversal
function processNode<T>(node: MosaicNode<T>, path: number[] = []): void {
  if (isSplitNode(node)) {
    console.log(`Split node at path [${path.join(', ')}]:`, node.direction);
    node.children.forEach((child, index) => {
      processNode(child, [...path, index]);
    });
  } else if (isTabsNode(node)) {
    console.log(
      `Tab group at path [${path.join(', ')}]:`,
      node.tabs.length,
      'tabs',
    );
    node.tabs.forEach((tab, index) => {
      console.log(`  Tab ${index}:`, tab);
    });
  } else {
    console.log(`Panel at path [${path.join(', ')}]:`, node);
  }
}

// Get all panels in the tree
const allPanels = getLeaves(tree);

// Get specific node by path
const nodeAtPath = getNodeAtPath(tree, [1, 0]); // Second child's first child
```

Initial value can be specified in legacy format as the `convertLegacyToNary` utility is used internally to migrate old trees automatically.

## ❓ FAQ

**Q: Can I use React Mosaic without Blueprint?**
A: Yes! Simply omit Blueprint CSS imports and use `className=""` instead of the Blueprint theme classes.

**Q: How do I save and restore layouts?**
A: The tree structure is serializable JSON. Save the `currentNode` state and restore it as `initialValue` or `value`.

**Q: Can I customize the drag handles?**
A: Yes, use the `renderToolbar` prop on `MosaicWindow` to completely customize the toolbar.

**Q: Is server-side rendering (SSR) supported?**
A: Yes, React Mosaic works with SSR frameworks like Next.js, Gatsby, and others.

**Q: How do I handle deep nested layouts?**
A: Use the utility functions like `getNodeAtPath` and `updateTree` to efficiently work with complex trees.

**Q: Can I disable drag and drop?**
A: Yes, set `draggable={false}` on `MosaicWindow` components or don't provide `createNode`.

**Q: How do I add keyboard shortcuts?**
A: Implement keyboard event handlers in your components and use the context API to trigger actions.

**Q: Is there a maximum number of panels?**
A: No hard limit, but performance may degrade with very large numbers of panels (1000+).

## 🆘 Support

- **GitHub Issues**: [Report bugs or request features](https://github.com/nomcopter/react-mosaic/issues)
- **Discussions**: [Ask questions and share ideas](https://github.com/nomcopter/react-mosaic/discussions)
- **Stack Overflow**: Use the `react-mosaic` tag

## 📄 License

Copyright 2019 Kevin Verdieck, originally developed at Palantir Technologies, Inc.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

---

<div align="center">

**⭐ Star this repository if you find it useful!**

</div>
