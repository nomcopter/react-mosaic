# Claude Code Integration for React Mosaic

This directory contains all the files for optimal Claude Code and LLM integration with the React Mosaic project.

## Directory Contents

### Configuration Files
- **`settings.json`**: Claude Code project settings and preferences
- **`.claudeignore`** (in root): Files/directories to exclude from LLM context

### Documentation
- **`../claude.md`**: Comprehensive project documentation for LLMs (in root)
- **`../CONTRIBUTING_AI.md`**: AI/LLM-specific contribution guidelines (in root)
- **`../QUICKREF.md`**: Quick reference guide for common operations (in root)

### Slash Commands (`commands/`)
Quick commands for common development tasks:

- `/test` - Run tests and report failures
- `/build` - Build the library
- `/lint` - Run linting checks
- `/type-check` - Run TypeScript type checking
- `/analyze-tree` - Analyze tree manipulation utilities
- `/review-component` - Review a specific component
- `/explain-concept` - Explain core React Mosaic concepts
- `/add-feature` - Plan and implement a new feature
- `/fix-issue` - Debug and fix an issue
- `/refactor` - Refactor code for better quality
- `/update-deps` - Check for outdated dependencies

### Prompt Templates (`prompts/`)
Reusable templates for common scenarios:

- **`tree-analysis.md`**: Template for analyzing tree structures
- **`code-review.md`**: Template for reviewing code
- **`feature-planning.md`**: Template for planning new features
- **`debugging.md`**: Template for debugging issues

## Quick Start for AI Assistants

1. **Read `claude.md` first** - This provides comprehensive context about the project
2. **Check `QUICKREF.md`** - Quick reference for common operations
3. **Review `.claudeignore`** - Know what files to skip
4. **Use slash commands** - Quick access to common tasks
5. **Follow patterns in `CONTRIBUTING_AI.md`** - Guidelines for code contributions

## Project Structure Overview

```
react-mosaic/
├── .claude/                          # Claude Code integration files
│   ├── commands/                     # Slash commands
│   ├── prompts/                      # Prompt templates
│   ├── settings.json                 # Project settings
│   └── README.md                     # This file
├── libs/react-mosaic-component/      # Main library [PRIMARY FOCUS]
│   └── src/lib/                      # Source code
│       ├── types.ts                  # Type definitions
│       ├── contextTypes.ts           # Context types
│       └── util/                     # Utility functions
├── apps/website/                     # Docusaurus docs + demo
├── claude.md                         # LLM integration guide
├── CONTRIBUTING_AI.md                # AI contribution guidelines
├── QUICKREF.md                       # Quick reference
├── .claudeignore                     # Files to ignore
└── README.md                         # User documentation
```

## Key Concepts

React Mosaic is a tiling window manager built on:

1. **N-ary Tree Structure**: Layout represented as a tree with split nodes, tab nodes, and leaf nodes
2. **Numeric Paths**: Nodes identified by array of indices (e.g., `[0, 1, 2]`)
3. **Immutable Updates**: Tree modifications always create new instances
4. **React Context**: Components communicate via context API
5. **Drag & Drop**: Built on react-dnd with multi-backend support

## Development Workflow

```bash
# Setup
npm install

# Development
npm start           # Start dev server
npm test           # Run tests
npm run build:lib  # Build library

# Code Quality
npm run lint       # Lint code
npm run format     # Format code
```

## Important Files

| File | Description |
|------|-------------|
| `libs/react-mosaic-component/src/index.ts` | Public API exports |
| `libs/react-mosaic-component/src/lib/types.ts` | Type definitions |
| `libs/react-mosaic-component/src/lib/util/mosaicUtilities.ts` | Tree operations |
| `libs/react-mosaic-component/src/lib/util/mosaicUpdates.ts` | Tree mutations |

## Using Slash Commands

Slash commands provide quick access to common tasks:

```
/test                 # Run the test suite
/build                # Build the library
/explain-concept      # Learn about a core concept
/add-feature          # Plan and add a new feature
```

## Using Prompt Templates

Prompt templates help maintain consistency:

1. Navigate to `.claude/prompts/`
2. Choose appropriate template
3. Follow the structure provided
4. Adapt to your specific need

## Best Practices for AI

1. **Always read files before modifying** - Use Read tool first
2. **Use utility functions** - Don't manually manipulate trees
3. **Follow existing patterns** - Match code style and conventions
4. **Write tests** - Add tests for new functionality
5. **Check types** - Ensure TypeScript compilation passes
6. **Use type guards** - Use `isSplitNode()` and `isTabsNode()`
7. **Validate paths** - Check paths before tree operations
8. **Handle edge cases** - Test with empty, single, and nested trees

## Common Patterns

### Tree Manipulation
```typescript
import { updateTree, createRemoveUpdate } from 'react-mosaic-component';

const newTree = updateTree(currentTree, [
  createRemoveUpdate(path)
]);
```

### Type Checking
```typescript
import { isSplitNode, isTabsNode } from 'react-mosaic-component';

if (isSplitNode(node)) {
  // node is MosaicSplitNode<T>
}
```

### Context Access
```typescript
import { useContext } from 'react';
import { MosaicContext } from 'react-mosaic-component';

const { mosaicActions } = useContext(MosaicContext);
mosaicActions.remove(path);
```

## Resources

- **Project Documentation**: `../claude.md`
- **Quick Reference**: `../QUICKREF.md`
- **AI Guidelines**: `../CONTRIBUTING_AI.md`
- **User Documentation**: `../README.md`
- **Live Demo**: https://nomcopter.github.io/react-mosaic/
- **GitHub**: https://github.com/nomcopter/react-mosaic

## Contributing

See `CONTRIBUTING_AI.md` for detailed guidelines on:
- Code style and conventions
- Testing requirements
- Common patterns
- Debugging strategies
- Performance considerations

## Support

For issues or questions:
- Check `claude.md` for comprehensive information
- Use `/explain-concept` to understand core concepts
- Review existing code for patterns
- Ask specific questions about the codebase

## Version

This integration is designed for React Mosaic v7.

Last updated: 2026-04-15
