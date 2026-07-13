<!-- nx configuration start-->
<!-- Leave the start & end comments to automatically receive updates. -->

# General Guidelines for working with Nx

- For navigating/exploring the workspace, invoke the `nx-workspace` skill first - it has patterns for querying projects, targets, and dependencies
- When running tasks (for example build, lint, test, e2e, etc.), always prefer running the task through `nx` (i.e. `nx run`, `nx run-many`, `nx affected`) instead of using the underlying tooling directly
- Prefix nx commands with the workspace's package manager (e.g., `pnpm nx build`, `npm exec nx test`) - avoids using globally installed CLI
- You have access to the Nx MCP server and its tools, use them to help the user
- For Nx plugin best practices, check `node_modules/@nx/<plugin>/PLUGIN.md`. Not all plugins have this file - proceed without it if unavailable.
- NEVER guess CLI flags - always check nx_docs or `--help` first when unsure

## Scaffolding & Generators

- For scaffolding tasks (creating apps, libs, project structure, setup), ALWAYS invoke the `nx-generate` skill FIRST before exploring or calling MCP tools

## When to use nx_docs

- USE for: advanced config options, unfamiliar flags, migration guides, plugin configuration, edge cases
- DON'T USE for: basic generator syntax (`nx g @nx/react:app`), standard commands, things you already know
- The `nx-generate` skill handles generator discovery internally - don't call nx_docs just to look up generator syntax

<!-- nx configuration end-->

# React Mosaic

Project guidance for any AI coding agent or contributor. It is tool-neutral —
Claude Code reads it via `CLAUDE.md` (which imports this file); other agent tools
(Cursor, Codex, Aider, Zed, …) read `AGENTS.md` directly.

**React Mosaic** (`react-mosaic-component`) is a tiling window manager for React
16–19: a drag-and-drop tree of resizable, rearrangeable panels. Full TypeScript,
Apache-2.0, currently `7.0.0-beta0`. It's an Nx monorepo built with Vite + tsup
(see the Nx guidelines above for how to run tasks).

- **Library** (primary focus): `libs/react-mosaic-component/`
- **Docs site + live demo** (Docusaurus): `apps/website/`

## How to work in this codebase

- **The tree is immutable.** Never mutate a `MosaicNode` in place — go through
  `updateTree` and the `create*Update` helpers. In-place mutation is the #1 cause
  of "my change isn't showing up".
- **Use the utilities, not hand-rolled traversal.** `util/mosaicUtilities.ts` and
  `util/mosaicUpdates.ts` are well-tested and handle the edge cases.
- **Narrow with type guards** (`isSplitNode`, `isTabsNode`) before touching
  node-specific fields; anything else is a leaf.
- **Change state through context actions** (`mosaicActions` /
  `mosaicWindowActions`), not by rewriting the tree yourself.
- **Paths are numeric** index arrays (`[0, 1]`), not strings.
- **Read before you edit**, match the surrounding patterns, and add a co-located
  `*.spec` test with every change — cover empty, single-node, and deeply-nested
  trees.

## Conventions

- **TypeScript strict**, no `any` (use `unknown`); explicit param/return types;
  components are generic over the panel key `<T>`.
- **Functional components + hooks**; no side effects in render; stabilize
  callbacks with `useCallback`; JSDoc on public APIs.
- **Naming:** PascalCase components/types, camelCase utilities,
  UPPER_SNAKE_CASE constants. One component per file, named after it.
- **Styles:** LESS with BEM; theme via CSS variables; optional Blueprint theme.
- Anything user-facing must be exported from
  `libs/react-mosaic-component/src/index.ts`.
- **Commits:** conventional-commit format, focused and atomic. Branch off
  `master`; PRs reference the issue, describe the change, and attach screenshots
  for any UI change.

## Detailed references

- [Architecture](.claude/context/architecture.md) — the MosaicNode tree, key
  files, the utilities & component API, theming, performance, legacy migration.
- [Development](.claude/context/development.md) — commands, testing, the build
  system, git/PR workflow, CI, and troubleshooting.

## Quick commands

```bash
npm install             # install
npm start               # docs site + hot-reloading demo
npm test                # all tests
npm run lint            # lint
npm run build:lib       # build the library
npm run build-lib:check # type-check only (tsc --noEmit)
```
