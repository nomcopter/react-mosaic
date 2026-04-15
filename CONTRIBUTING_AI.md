# AI/LLM Contributing Guide for React Mosaic

This guide is specifically for AI assistants and LLMs working on the React Mosaic codebase.

## Quick Start for AI

1. **Read `claude.md` first** - This contains comprehensive context about the project
2. **Check `.claudeignore`** - Know what files to skip
3. **Review key files** - Start with `libs/react-mosaic-component/src/index.ts` for public API

## Understanding the Codebase

### Mental Model

React Mosaic is fundamentally about **tree manipulation**:

```
Tree Node → Visual Layout
├── Split Node → Divides space between children
├── Tab Node → Stacks children as tabs
└── Leaf Node → Individual panel
```

### Critical Insights

1. **Trees are immutable** - Always create new tree instances, never mutate
2. **Paths are numeric arrays** - `[0, 1, 2]` means root → first child → second child → third child
3. **Type guards are essential** - Use `isSplitNode()` and `isTabsNode()` to safely narrow types
4. **Context provides actions** - Don't manipulate trees directly in components
5. **Legacy support exists** - Binary trees auto-convert to n-ary trees

### Code Reading Order

When exploring the codebase, read in this order:

1. **Types** (`types.ts`) - Understand data structures
2. **Utilities** (`util/mosaicUtilities.ts`) - Learn tree operations
3. **Root component** (`Mosaic.tsx`) - See how it all comes together
4. **Window component** (`MosaicWindow.tsx`) - Understand individual panels
5. **Updates** (`util/mosaicUpdates.ts`) - Learn tree mutations

## Code Modification Guidelines

### Before Making Changes

- [ ] Read the file(s) you're about to modify
- [ ] Read related test files
- [ ] Understand the existing pattern
- [ ] Check if there's a utility function that does what you need

### When Writing Code

**Type Safety**
```typescript
// ✅ Good - Use type guards
if (isSplitNode(node)) {
  node.children.forEach(child => ...);
}

// ❌ Bad - Unsafe type assumption
if (node.type === 'split') {
  (node as any).children.forEach(...);
}
```

**Tree Manipulation**
```typescript
// ✅ Good - Use utility functions
const newTree = updateTree(currentTree, [
  createRemoveUpdate(path)
]);

// ❌ Bad - Manual manipulation
const newTree = { ...currentTree };
delete newTree.children[0]; // Wrong!
```

**Path Operations**
```typescript
// ✅ Good - Numeric paths
const path: MosaicPath = [0, 1, 2];
const node = getNodeAtPath(tree, path);

// ❌ Bad - String paths (legacy only)
const path = ['first', 'second']; // Don't use!
```

**Context Usage**
```typescript
// ✅ Good - Use context actions
const { mosaicActions } = useContext(MosaicContext);
mosaicActions.remove(path);

// ❌ Bad - Direct state manipulation
setTree(removeNodeFromTree(tree, path)); // Avoid!
```

### Testing Requirements

When adding/modifying code:

1. **Unit tests** - Add tests for new utilities in `*.spec.ts` files
2. **Type tests** - Ensure TypeScript compilation passes
3. **Visual tests** - Test in the website playground (`npm start`) for component changes
4. **Edge cases** - Test with empty trees, single nodes, deeply nested trees

### Code Style Checklist

- [ ] Use TypeScript strict mode (no `any`, explicit types)
- [ ] Follow existing naming conventions (PascalCase for components, camelCase for functions)
- [ ] Add JSDoc comments for public APIs
- [ ] Use functional components with hooks
- [ ] Avoid side effects in render functions
- [ ] Keep functions small and focused (prefer multiple small functions)

## Common Patterns

### Component Pattern

```typescript
interface MyComponentProps<T> {
  value: T;
  onChange: (newValue: T) => void;
  className?: string;
}

export function MyComponent<T>({
  value,
  onChange,
  className
}: MyComponentProps<T>) {
  // Implementation
  return <div className={className}>...</div>;
}
```

### Utility Function Pattern

```typescript
/**
 * Description of what this function does
 * @param param1 Description
 * @returns Description
 */
export function utilityFunction<T>(
  param1: MosaicNode<T>
): MosaicNode<T> {
  // Guard clauses first
  if (!param1) {
    throw new Error('param1 is required');
  }

  // Main logic
  // ...

  return result;
}
```

### Test Pattern

```typescript
import { describe, it, expect } from 'vitest';

describe('MyUtility', () => {
  it('should handle normal case', () => {
    const input = createTestTree();
    const result = myUtility(input);
    expect(result).toEqual(expectedOutput);
  });

  it('should handle edge case', () => {
    const input = null;
    expect(() => myUtility(input)).toThrow();
  });
});
```

## AI-Specific Workflows

### Adding a Feature

1. Use `/add-feature` command
2. Ask clarifying questions if needed
3. Explore related code
4. Create implementation plan
5. Write tests first (TDD)
6. Implement feature
7. Run tests
8. Update documentation

### Fixing a Bug

1. Use `/fix-issue` command
2. Reproduce the issue
3. Write a failing test
4. Find root cause
5. Fix the bug
6. Verify test passes
7. Check for similar issues
8. Update documentation if needed

### Refactoring

1. Use `/refactor` command
2. Understand current implementation
3. Write tests for current behavior
4. Make incremental changes
5. Run tests after each change
6. Verify no functionality changes
7. Update comments/docs

### Code Review

1. Use `/review-component` command
2. Check type safety
3. Check for proper error handling
4. Check for accessibility
5. Check for performance issues
6. Check for security issues
7. Suggest improvements

## Understanding Tree Operations

### Reading Trees

```typescript
// Get all panel IDs
const panels = getLeaves(tree);

// Get node at specific location
const node = getNodeAtPath(tree, [0, 1]);

// Check node type
if (isSplitNode(node)) {
  console.log('Direction:', node.direction);
  console.log('Children:', node.children.length);
}
```

### Modifying Trees

```typescript
// Remove a node
const removeUpdate = createRemoveUpdate([0, 1]);
const newTree = updateTree(tree, [removeUpdate]);

// Expand a node
const expandUpdate = createExpandUpdate([0], 75);
const newTree = updateTree(tree, [expandUpdate]);

// Multiple updates
const newTree = updateTree(tree, [
  removeUpdate,
  expandUpdate,
]);
```

### Creating Trees

```typescript
// Balanced tree from panels
const panels = ['a', 'b', 'c', 'd'];
const tree = createBalancedTreeFromLeaves(panels);

// Manual tree construction
const tree: MosaicNode<string> = {
  type: 'split',
  direction: 'row',
  splitPercentages: [40, 60],
  children: [
    'panel1',
    {
      type: 'tabs',
      tabs: ['panel2', 'panel3'],
      activeTabIndex: 0,
    },
  ],
};
```

## Performance Considerations

### Do's
- ✅ Use `React.memo` for tile components
- ✅ Memoize expensive calculations with `useMemo`
- ✅ Use stable callback references with `useCallback`
- ✅ Minimize tree updates (batch when possible)
- ✅ Use path-based operations (O(path depth))

### Don'ts
- ❌ Don't traverse entire tree on every render
- ❌ Don't create new callbacks in render
- ❌ Don't use inline object literals in props
- ❌ Don't update tree on every mouse move (throttle)
- ❌ Don't create deep tree nesting (>10 levels)

## Debugging Strategies

### For Tree Issues
1. Log the tree: `console.log(JSON.stringify(tree, null, 2))`
2. Log paths: `console.log('Path:', path.join(' → '))`
3. Verify tree structure: Check for invalid nodes
4. Use type guards: Ensure correct node types

### For Component Issues
1. Use React DevTools
2. Check context values
3. Verify props are stable
4. Check for unnecessary re-renders
5. Log lifecycle events

### For Drag & Drop Issues
1. Check drag-drop context setup
2. Verify backend initialization
3. Check drop target positions
4. Log drag events
5. Verify update generation

## File Organization

When creating new files:

**Components**
- Location: `libs/react-mosaic-component/src/lib/`
- Naming: `ComponentName.tsx`
- Tests: `ComponentName.spec.tsx` (co-located)

**Utilities**
- Location: `libs/react-mosaic-component/src/lib/util/`
- Naming: `utilityName.ts`
- Tests: `utilityName.spec.ts` (co-located)

**Types**
- Public types: `types.ts`
- Context types: `contextTypes.ts`
- Internal types: `internalTypes.ts`

**Styles**
- Location: `libs/react-mosaic-component/src/lib/styles/`
- Naming: `component-name.less`
- Entry: Import in `index.less`

## Git Workflow

### Commits
- Use conventional commits format
- Keep commits focused and atomic
- Write descriptive commit messages

### Branches
- Create feature branches from `master`
- Use descriptive branch names: `feature/add-keyboard-shortcuts`
- Keep branches up to date with master

### Pull Requests
- Reference related issues
- Include description of changes
- Add screenshots for UI changes
- Ensure CI passes

## Questions to Ask

When unsure about implementation:

1. **"Is there an existing utility function for this?"**
   - Check `mosaicUtilities.ts` and `mosaicUpdates.ts`

2. **"What's the existing pattern for this?"**
   - Look for similar components/functions

3. **"Does this handle all node types?"**
   - Consider split nodes, tab nodes, and leaf nodes

4. **"Is this type-safe?"**
   - Use type guards, avoid `any`

5. **"Does this need tests?"**
   - Yes, if it's not purely presentational

6. **"Will this work with controlled and uncontrolled modes?"**
   - Check if it affects state management

7. **"Is this accessible?"**
   - Consider keyboard navigation, screen readers, focus management

8. **"What about edge cases?"**
   - Empty trees, single nodes, deeply nested, maximum depth

## Resources

- **Main docs**: `claude.md`
- **User docs**: `README.md`
- **Type reference**: `libs/react-mosaic-component/src/lib/types.ts`
- **Utility reference**: `libs/react-mosaic-component/src/lib/util/`
- **Demo examples**: `apps/website/src/components/Playground/`

## Helpful Commands

```bash
# Development
npm start                  # Start Docusaurus site (with live playground)
npm test                   # Run tests
npm run test:watch        # Watch mode
npm run build:lib         # Build library
npm run lint              # Check linting
npm run format            # Format code

# Type checking
npm run build-lib:check   # TypeScript check

# Specific tests
npm test -- --testNamePattern="TreeUtils"
npm test -- libs/react-mosaic-component/src/lib/util/mosaicUtilities.spec.ts
```

## Common Mistakes to Avoid

1. **Using string paths** - Always use numeric paths (`[0, 1]` not `['first', 'second']`)
2. **Mutating trees** - Always return new tree instances
3. **Skipping type guards** - Always check node types before accessing properties
4. **Forgetting edge cases** - Test with empty, single, and deeply nested trees
5. **Not reading existing code** - Always read files before modifying
6. **Over-engineering** - Keep solutions simple and focused
7. **Breaking changes** - Maintain backward compatibility with public APIs
8. **Ignoring TypeScript errors** - Fix all type errors, don't use `any`

## Success Criteria

Your changes are successful when:

- [ ] All tests pass
- [ ] TypeScript compiles without errors
- [ ] Linting passes
- [ ] Visual testing in demo app works
- [ ] Edge cases are handled
- [ ] Documentation is updated
- [ ] Code follows existing patterns
- [ ] No console errors/warnings
- [ ] Accessible (keyboard navigation, ARIA)
- [ ] Performance is acceptable

## Getting Help

If stuck:
1. Read `claude.md` for context
2. Use `/explain-concept` to understand core concepts
3. Use `/analyze-tree` to understand tree utilities
4. Ask specific questions about the codebase
5. Review similar existing code for patterns

Remember: The codebase is well-structured and follows consistent patterns. When in doubt, look for existing examples and follow the same approach.
