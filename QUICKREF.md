# React Mosaic Quick Reference

A quick reference guide for developers and AI assistants working with React Mosaic.

## File Locations

| Purpose | Path |
|---------|------|
| Public API | `libs/react-mosaic-component/src/index.ts` |
| Types | `libs/react-mosaic-component/src/lib/types.ts` |
| Context | `libs/react-mosaic-component/src/lib/contextTypes.ts` |
| Tree Utils | `libs/react-mosaic-component/src/lib/util/mosaicUtilities.ts` |
| Tree Updates | `libs/react-mosaic-component/src/lib/util/mosaicUpdates.ts` |
| Main Component | `libs/react-mosaic-component/src/lib/Mosaic.tsx` |
| Window Component | `libs/react-mosaic-component/src/lib/MosaicWindow.tsx` |
| Styles | `libs/react-mosaic-component/src/lib/styles/` |

## Commands

| Task | Command |
|------|---------|
| Start dev server | `npm start` |
| Run tests | `npm test` |
| Build library | `npm run build:lib` |
| Build docs site | `npm run build:site` |
| Lint | `npm run lint` |
| Format | `npm run format` |
| Type check | `npm run build-lib:check` |
| Release | `npm run release` |

## Slash Commands

| Command | Description |
|---------|-------------|
| `/test` | Run tests and report failures |
| `/build` | Build the library |
| `/lint` | Run linting checks |
| `/type-check` | Run TypeScript type checking |
| `/analyze-tree` | Analyze tree utilities |
| `/review-component` | Review a component |
| `/explain-concept` | Explain core concepts |
| `/add-feature` | Plan and implement feature |
| `/fix-issue` | Debug and fix issue |
| `/refactor` | Refactor code |
| `/update-deps` | Check outdated dependencies |

## Tree Node Types

```typescript
// Split Node - Divides space between children
{
  type: 'split',
  direction: 'row' | 'column',
  children: MosaicNode<T>[],
  splitPercentages?: number[]
}

// Tab Node - Stacks children as tabs
{
  type: 'tabs',
  tabs: T[],
  activeTabIndex: number
}

// Leaf Node - Individual panel
T  // Just the panel ID (string or number)
```

## Common Utilities

### Type Guards

```typescript
import { isSplitNode, isTabsNode } from 'react-mosaic-component';

if (isSplitNode(node)) {
  // node is MosaicSplitNode<T>
}

if (isTabsNode(node)) {
  // node is MosaicTabsNode<T>
}
```

### Tree Operations

```typescript
import {
  getLeaves,
  getNodeAtPath,
  createBalancedTreeFromLeaves,
  convertLegacyToNary
} from 'react-mosaic-component';

// Get all leaf panel IDs
const panels = getLeaves(tree);

// Get node at path
const node = getNodeAtPath(tree, [0, 1, 2]);

// Create balanced layout
const tree = createBalancedTreeFromLeaves(['a', 'b', 'c']);

// Convert legacy tree
const modernTree = convertLegacyToNary(legacyTree);
```

### Tree Updates

```typescript
import {
  updateTree,
  createRemoveUpdate,
  createExpandUpdate,
  createHideUpdate
} from 'react-mosaic-component';

// Remove node at path
const newTree = updateTree(tree, [
  createRemoveUpdate([0, 1])
]);

// Expand node to percentage
const newTree = updateTree(tree, [
  createExpandUpdate([0], 75)
]);

// Hide node
const newTree = updateTree(tree, [
  createHideUpdate([1])
]);

// Multiple updates
const newTree = updateTree(tree, [
  removeUpdate,
  expandUpdate
]);
```

### Context Access

```typescript
import { useContext } from 'react';
import {
  MosaicContext,
  MosaicWindowContext
} from 'react-mosaic-component';

// In root descendants
const { mosaicActions } = useContext(MosaicContext);
mosaicActions.remove(path);
mosaicActions.expand(path);
mosaicActions.hide(path);

// In MosaicWindow descendants
const { mosaicWindowActions } = useContext(MosaicWindowContext);
mosaicWindowActions.split();
mosaicWindowActions.remove();
const path = mosaicWindowActions.getPath();
```

## Component Props

### Mosaic

```typescript
<Mosaic<T>
  // Required
  renderTile={(id, path) => ReactElement}

  // State (use one)
  initialValue={MosaicNode<T>}  // Uncontrolled
  value={MosaicNode<T>}          // Controlled

  // Handlers
  onChange={(newNode) => void}
  onRelease={(newNode) => void}

  // Config
  className={string}
  blueprintNamespace={string}
  createNode={() => T}
  resize={ResizeOptions}
  zeroStateView={ReactElement}
/>
```

### MosaicWindow

```typescript
<MosaicWindow<T>
  // Required
  title={string}
  path={MosaicPath}

  // Config
  className={string}
  toolbarControls={ReactNode}
  draggable={boolean}
  createNode={() => T}

  // Handlers
  onDragStart={() => void}
  onDragEnd={(type) => void}
/>
```

## Tree Examples

### Simple Split

```typescript
{
  type: 'split',
  direction: 'row',
  splitPercentages: [40, 60],
  children: ['left', 'right']
}
```

### Nested Splits

```typescript
{
  type: 'split',
  direction: 'row',
  children: [
    'left',
    {
      type: 'split',
      direction: 'column',
      children: ['top-right', 'bottom-right']
    }
  ]
}
```

### Tabs

```typescript
{
  type: 'tabs',
  tabs: ['tab1', 'tab2', 'tab3'],
  activeTabIndex: 0
}
```

### Complex Layout

```typescript
{
  type: 'split',
  direction: 'column',
  splitPercentages: [30, 70],
  children: [
    {
      type: 'tabs',
      tabs: ['overview', 'settings'],
      activeTabIndex: 0
    },
    {
      type: 'split',
      direction: 'row',
      children: ['main', 'sidebar']
    }
  ]
}
```

## Path Examples

```typescript
[]           // Root node
[0]          // First child of root
[1]          // Second child of root
[0, 0]       // First child of first child
[1, 2]       // Third child of second child
[0, 1, 0]    // First child of second child of first child
```

## TypeScript Patterns

### Generic Components

```typescript
interface MyComponentProps<T> {
  value: T;
  onChange: (value: T) => void;
}

function MyComponent<T>({ value, onChange }: MyComponentProps<T>) {
  // Implementation
}
```

### Type-Safe Tree Manipulation

```typescript
function processNode<T>(node: MosaicNode<T>): void {
  if (isSplitNode(node)) {
    node.children.forEach(processNode);  // Recurse
  } else if (isTabsNode(node)) {
    node.tabs.forEach(tab => console.log(tab));
  } else {
    console.log('Leaf:', node);
  }
}
```

## Styling

### Blueprint Theme

```tsx
import '@blueprintjs/core/lib/css/blueprint.css';
import '@blueprintjs/icons/lib/css/blueprint-icons.css';
import 'react-mosaic-component/react-mosaic-component.css';

<Mosaic
  className="mosaic-blueprint-theme"
  blueprintNamespace="bp5"
/>
```

### Dark Theme

```tsx
<Mosaic
  className="mosaic-blueprint-theme bp5-dark"
/>
```

### Custom Theme

```css
.my-theme {
  --mosaic-border: 1px solid #ccc;
}

.my-theme .mosaic-window {
  border: var(--mosaic-border);
}
```

## Common Patterns

### Controlled State

```tsx
const [tree, setTree] = useState<MosaicNode<string>>(initialTree);

<Mosaic
  value={tree}
  onChange={setTree}
  renderTile={renderTile}
/>
```

### Custom Toolbar

```tsx
import { RemoveButton, SplitButton } from 'react-mosaic-component';

const controls = (
  <>
    <SplitButton />
    <RemoveButton />
    <button onClick={customAction}>Custom</button>
  </>
);

<MosaicWindow toolbarControls={controls} />
```

### Programmatic Updates

```tsx
const handleAddPanel = () => {
  const newTree = {
    type: 'split',
    direction: 'column',
    children: [currentTree, 'new-panel']
  };
  setTree(newTree);
};
```

## Testing

### Unit Test Template

```typescript
import { describe, it, expect } from 'vitest';

describe('MyUtility', () => {
  it('should handle normal case', () => {
    const result = myUtility(input);
    expect(result).toEqual(expected);
  });

  it('should throw on invalid input', () => {
    expect(() => myUtility(null)).toThrow();
  });
});
```

### Running Tests

```bash
# All tests
npm test

# Specific file
npm test -- libs/react-mosaic-component/src/lib/util/mosaicUtilities.spec.ts

# Pattern matching
npm test -- --testNamePattern="Tree"

# Watch mode
npm run test:watch
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Build fails | Clear `dist/` and `node_modules/.cache/` |
| Type errors | Run `npm run build-lib:check` for details |
| Tests fail | Run individually to isolate issue |
| Styles missing | Ensure CSS imported in app |
| Drag not working | Check drag-drop context setup |

## Performance Tips

- Use `React.memo` for tile components
- Memoize callbacks with `useCallback`
- Avoid deep nesting (>10 levels)
- Batch tree updates when possible
- Use path operations (O(depth))

## Accessibility

- Keyboard navigation supported
- Use semantic HTML
- Add ARIA labels where needed
- Test with screen readers
- Ensure focus management

## Migration (Legacy to Modern)

```typescript
// OLD (v6)
{
  direction: 'row',
  first: 'left',
  second: 'right',
  splitPercentage: 40
}

// NEW (v7+)
{
  type: 'split',
  direction: 'row',
  children: ['left', 'right'],
  splitPercentages: [40, 60]
}

// OR use conversion utility
const modernTree = convertLegacyToNary(legacyTree);
```

## Useful Links

- [GitHub Repo](https://github.com/nomcopter/react-mosaic)
- [Live Demo](https://nomcopter.github.io/react-mosaic/)
- [NPM Package](https://www.npmjs.com/package/react-mosaic-component)
- [Full Documentation](./claude.md)
- [AI Contributing Guide](./CONTRIBUTING_AI.md)
- [Main README](./README.md)

## Key Takeaways

1. **Trees are immutable** - Always create new instances
2. **Use utility functions** - Don't manually manipulate trees
3. **Paths are numeric** - Use `[0, 1, 2]` not `['first', 'second']`
4. **Type guards essential** - Use `isSplitNode()` and `isTabsNode()`
5. **Context for actions** - Use context API for tree operations
6. **Test everything** - Unit tests, type checks, visual tests
7. **Follow patterns** - Match existing code style
8. **Read before writing** - Always read files before modifying
