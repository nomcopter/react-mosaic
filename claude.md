# React Mosaic - LLM Integration Guide

## Project Overview

**React Mosaic** is a powerful React component library that provides a tiling window manager for building sophisticated, user-controlled interfaces. Users can dynamically resize, rearrange, and customize panel layouts through an intuitive drag-and-drop interface.

**Key Information:**

- **Package**: `react-mosaic-component`
- **Version**: 7.0.0-beta0
- **License**: Apache License 2.0
- **React Support**: React 16-19
- **TypeScript**: Full TypeScript support
- **Build System**: Nx monorepo with Vite and tsup

## Architecture

### Core Concepts

#### 1. N-ary Tree Structure

The layout system uses an n-ary tree structure where nodes can have multiple children:

```typescript
type MosaicNode<T> = MosaicSplitNode<T> | MosaicTabsNode<T> | T;

interface MosaicSplitNode<T> {
  type: 'split';
  direction: 'row' | 'column';
  children: MosaicNode<T>[];
  splitPercentages?: number[]; // Defaults to equal distribution
}

interface MosaicTabsNode<T> {
  type: 'tabs';
  tabs: T[];
  activeTabIndex: number;
}
```

- **Split Nodes**: Container nodes that divide space between multiple children (horizontally or vertically)
- **Tab Nodes**: Container nodes that stack children in tabs
- **Leaf Nodes**: Individual panels identified by unique keys (strings or numbers)

#### 2. Path System

Paths are arrays of numbers representing the route to a node in the tree:

- `[]` - Root node
- `[0]` - First child of root
- `[1, 2]` - Third child of second child of root

#### 3. Drag & Drop System

Built on `react-dnd` with support for:

- HTML5 backend (desktop)
- Touch backend (mobile)
- Multi-backend switching (automatic)

## Project Structure

```
react-mosaic/
├── apps/
│   └── website/                            # Docusaurus docs + demo
│       ├── docs/                           # Markdown/MDX docs + typedoc API
│       ├── src/
│       │   ├── pages/                      # Landing, /demo
│       │   └── components/Demo/            # Live demo app
│       ├── static/img/                     # Favicon, logos
│       ├── docusaurus.config.ts            # Site config (typedoc, webpack alias)
│       └── project.json                    # Nx project config
│
├── libs/
│   └── react-mosaic-component/             # Main library [PRIMARY FOCUS]
│       ├── src/
│       │   ├── index.ts                    # Public API exports
│       │   └── lib/
│       │       ├── Mosaic.tsx              # Root component
│       │       ├── MosaicWindow.tsx        # Window wrapper
│       │       ├── MosaicRoot.tsx          # Tree renderer
│       │       ├── MosaicTabs.tsx          # Tab container
│       │       ├── Split.tsx               # Split divider
│       │       ├── MosaicDropTarget.tsx    # Drag-drop target
│       │       ├── DraggableTab.tsx        # Draggable tab
│       │       ├── MosaicZeroState.tsx     # Empty state
│       │       ├── RootDropTargets.tsx     # Root drop zones
│       │       ├── buttons/                # Toolbar buttons
│       │       ├── util/                   # Utilities [IMPORTANT]
│       │       │   ├── mosaicUtilities.ts  # Tree operations
│       │       │   ├── mosaicUpdates.ts    # Tree mutations
│       │       │   └── BoundingBox.ts      # Layout calculations
│       │       ├── styles/                 # LESS stylesheets
│       │       ├── types.ts                # Public type definitions
│       │       ├── contextTypes.ts         # React context types
│       │       └── internalTypes.ts        # Internal types
│       ├── package.json                    # Library package config
│       ├── project.json                    # Nx project config
│       ├── tsconfig.lib.json               # TypeScript config
│       └── vite.config.ts                  # Vite build config
│
├── .github/workflows/
│   ├── claude.yml                          # Claude Code integration
│   ├── deployment.yml                      # GitHub Pages deployment
│   └── publish.yaml                        # NPM publishing
│
├── package.json                            # Root workspace config
├── nx.json                                 # Nx configuration
├── tsup.config.ts                          # Library build config
├── tsconfig.base.json                      # Base TypeScript config
├── eslint.config.mjs                       # ESLint configuration
├── .prettierrc.yml                         # Prettier configuration
└── README.md                               # Main documentation
```

### Key Directories

- **`libs/react-mosaic-component/src/lib/`**: Core library implementation (all components, utilities, types)
- **`libs/react-mosaic-component/src/lib/util/`**: Tree manipulation utilities (CRUCIAL for understanding layout logic)
- **`libs/react-mosaic-component/src/lib/buttons/`**: Toolbar button components
- **`apps/website/`**: Docusaurus documentation site, including the interactive `/demo` app under `src/components/Demo/`

## Important Files Reference

### Entry Points

**`libs/react-mosaic-component/src/index.ts`** - Public API

- Exports all public components, types, utilities, and context
- This is the single source of truth for what's publicly available

### Core Components

**`libs/react-mosaic-component/src/lib/Mosaic.tsx`** - Root Component

- Main entry point for using the library
- Handles state management (controlled/uncontrolled)
- Sets up drag-drop context
- Key props: `renderTile`, `onChange`, `value`/`initialValue`, `className`

**`libs/react-mosaic-component/src/lib/MosaicRoot.tsx`** - Tree Renderer

- Recursive rendering of tree structure
- Automatically converts legacy binary trees to n-ary format
- Handles both split nodes and tab nodes

**`libs/react-mosaic-component/src/lib/MosaicWindow.tsx`** - Window Wrapper

- Wraps tile content with title bar and toolbar
- Provides drag handles for rearranging windows
- Key props: `title`, `path`, `toolbarControls`, `draggable`

**`libs/react-mosaic-component/src/lib/MosaicTabs.tsx`** - Tab Container

- Renders tabbed interface for multiple panels
- Handles tab switching and tab dragging
- Integrates with `DraggableTab` component

**`libs/react-mosaic-component/src/lib/Split.tsx`** - Divider

- Renders resizable split bar between panels
- Handles mouse/touch drag to resize
- Supports both horizontal and vertical splits

### Type System

**`libs/react-mosaic-component/src/lib/types.ts`** - Public Types

- `MosaicNode<T>`: Union type for tree nodes
- `MosaicSplitNode<T>`: Split container type
- `MosaicTabsNode<T>`: Tab container type
- `MosaicPath`: Numeric path array
- `MosaicKey`: Panel identifier type
- `TileRenderer<T>`: Tile rendering function type
- `MosaicUpdate<T>`: Tree mutation specification

**`libs/react-mosaic-component/src/lib/contextTypes.ts`** - Context Types

- `MosaicContext<T>`: Root context with actions
- `MosaicRootActions<T>`: Tree manipulation actions
- `MosaicWindowContext`: Window-specific context
- `MosaicWindowActions`: Window manipulation actions

### Utilities (CRITICAL)

**`libs/react-mosaic-component/src/lib/util/mosaicUtilities.ts`**

- `isSplitNode(node)`: Type guard for split nodes
- `isTabsNode(node)`: Type guard for tab nodes
- `getNodeAtPath(tree, path)`: Get node at specific path
- `getParentNode(tree, path)`: Get parent of node
- `getLeaves(tree)`: Get all leaf node IDs
- `createBalancedTreeFromLeaves(leaves)`: Create balanced layout
- `convertLegacyToNary(legacyNode)`: Convert v6 binary trees to n-ary

**`libs/react-mosaic-component/src/lib/util/mosaicUpdates.ts`**

- `updateTree(tree, updates)`: Apply mutations to tree
- `createRemoveUpdate(path)`: Remove node at path
- `createExpandUpdate(path, percentage)`: Expand node to percentage
- `createHideUpdate(path)`: Hide node temporarily
- `createDragToUpdates(tree, sourcePath, destinationPath, position)`: Drag-drop updates

### Styling

**`libs/react-mosaic-component/src/lib/styles/`** - LESS Stylesheets

- `index.less`: Main entry (imports all others)
- `mosaic.less`: Core layout styles
- `mosaic-window.less`: Window/panel styles
- `blueprint-theme.less`: Blueprint theme integration
- `mixins.less`: Reusable LESS mixins

## Development Workflow

### Setup

```bash
# Install dependencies
npm install

# Start dev server (runs Docusaurus site with hot-reloading demo)
npm start

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Lint code
npm run lint

# Format code
npm run format
```

### Building

```bash
# Build library (outputs to dist/libs/react-mosaic-component/)
npm run build:lib

# Build the docs site (outputs to apps/website/build/)
npm run build:site
```

### Testing

**Framework**: Vitest with Testing Library
**Location**: `libs/react-mosaic-component/src/lib/util/*.spec.ts`

Key test files:

- `mosaicUtilities.spec.ts`: Tree manipulation tests
- `mosaicUpdates.spec.ts`: Update operations tests
- `boundingBox.spec.ts`: Layout calculation tests

Run specific tests:

```bash
npm test -- --testNamePattern="Mosaic"
npm test -- libs/react-mosaic-component/src/lib/util/mosaicUtilities.spec.ts
```

### Release Process

```bash
# Run linting and tests, then create release
npm run release

# This uses nx release to:
# 1. Bump version
# 2. Update changelog
# 3. Create git tag
# 4. Skip npm publish (done via CI)
```

## Code Style & Conventions

### TypeScript

- **Strict mode enabled**: All type checking rules enforced
- **Generic typing**: Components use generic `<T>` for panel IDs
- **Explicit types**: All function parameters and return types should be typed
- **No `any`**: Avoid using `any`, use `unknown` if type is truly unknown

### React Patterns

- **Functional components**: Use function components with hooks
- **Context API**: Use React context for cross-component communication
- **Controlled/Uncontrolled**: Support both patterns for state management
- **Props interfaces**: Define explicit interfaces for component props

### Naming Conventions

- **Components**: PascalCase (e.g., `MosaicWindow`, `DraggableTab`)
- **Utilities**: camelCase (e.g., `getNodeAtPath`, `updateTree`)
- **Types**: PascalCase (e.g., `MosaicNode`, `MosaicPath`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `DEFAULT_EXPAND_PERCENTAGE`)

### File Organization

- **Component files**: One component per file, named after the component
- **Utility files**: Group related utilities (e.g., all tree operations in `mosaicUtilities.ts`)
- **Test files**: Co-located with source files, use `.spec.ts` extension
- **Type files**: Separate files for types (`types.ts`, `contextTypes.ts`, `internalTypes.ts`)

### Styling

- **LESS**: Use LESS for stylesheets
- **BEM naming**: Follow BEM conventions for CSS classes
- **Theme support**: Use CSS variables for themeable properties
- **Blueprint integration**: Optional Blueprint theme support

## Common Tasks

### Adding a New Component

1. Create component file in `libs/react-mosaic-component/src/lib/`
2. Define TypeScript interface for props
3. Implement component using functional component pattern
4. Add tests in `*.spec.ts` file
5. Export from `index.ts` if public API
6. Add styling in `styles/` directory if needed

### Modifying Tree Structure

1. Identify the utility function needed (see `mosaicUtilities.ts` or `mosaicUpdates.ts`)
2. Use type guards (`isSplitNode`, `isTabsNode`) for type safety
3. Apply updates using `updateTree` function
4. Test thoroughly with different tree configurations

### Adding a New Toolbar Button

1. Create button component in `buttons/` directory
2. Follow pattern from existing buttons (e.g., `RemoveButton.tsx`)
3. Use `MosaicWindowContext` to access actions
4. Add to `defaultToolbarControls.tsx` if default button
5. Export from `index.ts`

### Updating Styles

1. Modify appropriate LESS file in `styles/` directory
2. Use mixins for reusable styles
3. Test with both Blueprint and non-Blueprint themes
4. Test light and dark modes
5. Build library to compile LESS to CSS

### Debugging Tips

- **React DevTools**: Use to inspect component tree and context
- **Console logging**: Add logs in utility functions to trace tree operations
- **Path tracing**: Log paths to understand node locations
- **Tree visualization**: Use `JSON.stringify(tree, null, 2)` to visualize tree structure

## Integration Points for LLMs

### Understanding the Codebase

When working with this codebase, focus on:

1. **Tree structure**: Everything revolves around the `MosaicNode` tree
2. **Path system**: Understand how numeric paths work
3. **Type system**: Leverage TypeScript types for understanding
4. **Utility functions**: These are well-tested and handle edge cases
5. **Context API**: Use for accessing actions within components

### Making Changes

When modifying code:

1. **Read relevant files first**: Always read files before modifying
2. **Understand tree operations**: Use utility functions rather than manual tree manipulation
3. **Test thoroughly**: Run tests after changes
4. **Check types**: Ensure TypeScript compilation passes
5. **Follow patterns**: Match existing code style and patterns

### Testing Changes

When testing:

1. **Unit tests**: Add/update tests in `*.spec.ts` files
2. **Visual testing**: Use demo app to visually verify changes
3. **Type checking**: Run `npm run build:lib` to check types
4. **Linting**: Run `npm run lint` to ensure code quality

### Key Insights

- **The tree is immutable**: All updates return new tree instances
- **Paths are numeric**: Use indices, not string-based paths
- **Type guards are essential**: Use `isSplitNode` and `isTabsNode` for safe type narrowing
- **Context provides actions**: Don't manipulate tree directly, use context actions
- **Legacy support**: Library auto-converts old binary trees to n-ary format

## Dependencies

### Production Dependencies

- **react-dnd**: Drag and drop functionality (v16.0.1)
- **immutability-helper**: Immutable updates (v3.1.1)
- **classnames**: Conditional CSS classes (v2.5.1)
- **lodash-es**: Utility functions (v4.17.21)
- **uuid**: Unique identifiers (v11.1.0)

### Development Dependencies

- **Nx**: Monorepo orchestration (v21.5.2)
- **Vite**: Build tool and dev server (v7.1.3)
- **tsup**: TypeScript bundler (v8.5.0)
- **Vitest**: Testing framework (v3.0.0)
- **TypeScript**: Type system (v5.5.4)
- **ESLint**: Linting (v9.8.0)
- **Prettier**: Code formatting (v3.5.3)

### Optional Dependencies

- **@blueprintjs/core**: UI framework for theming (v5.7.0)
- **@blueprintjs/icons**: Icons for Blueprint theme (v5.19.1)

## Build System Details

### Library Build (tsup)

**Configuration**: `tsup.config.ts`

Outputs:

- **ESM**: `dist/libs/react-mosaic-component/index.mjs`
- **CJS**: `dist/libs/react-mosaic-component/index.cjs`
- **Types**: `dist/libs/react-mosaic-component/index.d.ts`
- **CSS**: `dist/libs/react-mosaic-component/react-mosaic-component.css`

Build process:

1. TypeScript compilation with esbuild
2. LESS compilation with autoprefixer
3. Type definition generation
4. Package.json and README copying

### Website Build (Docusaurus)

**Configuration**: `apps/website/docusaurus.config.ts`

Build target: GitHub Pages static site
Output: `apps/website/build/`

Build process:

1. `docusaurus-plugin-typedoc` regenerates `docs/api/` from the library source
2. Docusaurus bundles docs, the landing page, and the `/demo` route
3. The demo webpack-aliases `react-mosaic-component` to the prebuilt `dist/libs/react-mosaic-component/index.mjs`, so `npm run build:lib` must run first (Nx's `implicitDependencies` handles this automatically)

## CI/CD

### GitHub Actions Workflows

**`.github/workflows/claude.yml`** - Claude Code Integration

- Triggers on `@claude` mentions in issues/PRs
- Provides AI assistance for development tasks

**`.github/workflows/deployment.yml`** - Deployment

- Builds the library, then the Docusaurus site, and deploys to GitHub Pages
- Triggers on push to master branch

**`.github/workflows/publish.yaml`** - Publishing

- Publishes library to NPM
- Triggers on new releases

## Performance Considerations

- **Large trees**: Performance degrades with 1000+ panels
- **Render optimization**: Use `React.memo` for tile components
- **Path operations**: O(n) where n is path depth
- **Tree updates**: Immutable updates create new tree instances
- **Drag operations**: Throttled to avoid excessive renders

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Accessibility

- Keyboard navigation supported
- ARIA labels on interactive elements
- Focus management for drag operations
- Screen reader compatible (when used with Blueprint)

## Troubleshooting

### Common Issues

**Build failures**:

- Clear `dist/` and `node_modules/.cache/` directories
- Run `npm install` to refresh dependencies
- Check Node.js version (18+ required)

**Type errors**:

- Run `npm run build:lib` to see full type errors
- Check `tsconfig.lib.json` for type configuration
- Ensure all imports use correct paths

**Test failures**:

- Run tests individually to isolate issues
- Check for async timing issues (use `waitFor`)
- Verify test environment setup (jsdom)

**Styling issues**:

- Ensure CSS is imported in application
- Check Blueprint CSS is loaded if using Blueprint theme
- Verify LESS compilation succeeded

## Additional Resources

- **GitHub Repository**: https://github.com/nomcopter/react-mosaic
- **Live Demo**: https://nomcopter.github.io/react-mosaic/
- **NPM Package**: https://www.npmjs.com/package/react-mosaic-component
- **Issue Tracker**: https://github.com/nomcopter/react-mosaic/issues

## Version History

- **v7.0.0**: Major version with n-ary tree support (migrated from binary trees), Docusaurus docs site with embedded demo
- **v6.x**: Legacy binary-tree versions

## Migration Notes

If working with legacy code (v6 or earlier), note that:

- Binary trees (`first`/`second`) are now n-ary (`children` array)
- String paths are now numeric paths
- `splitPercentage` is now `splitPercentages` array
- Use `convertLegacyToNary` utility for automatic conversion

## Security

- No known security vulnerabilities
- Dependencies regularly updated
- No sensitive data handling
- Client-side only (no server communication)

## License

Apache License 2.0 - See LICENSE file for details
Original copyright by Kevin Verdieck and Palantir Technologies, Inc.

<!-- nx configuration start-->
<!-- Leave the start & end comments to automatically receive updates. -->

# General Guidelines for working with Nx

- When running tasks (for example build, lint, test, e2e, etc.), always prefer running the task through `nx` (i.e. `nx run`, `nx run-many`, `nx affected`) instead of using the underlying tooling directly
- You have access to the Nx MCP server and its tools, use them to help the user
- When answering questions about the repository, use the `nx_workspace` tool first to gain an understanding of the workspace architecture where applicable.
- When working in individual projects, use the `nx_project_details` mcp tool to analyze and understand the specific project structure and dependencies
- For questions around nx configuration, best practices or if you're unsure, use the `nx_docs` tool to get relevant, up-to-date docs. Always use this instead of assuming things about nx configuration
- If the user needs help with an Nx configuration or project graph error, use the `nx_workspace` tool to get any errors

<!-- nx configuration end-->
