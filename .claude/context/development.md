# Development

Nx monorepo. Prefer running tasks through Nx (`nx run`, `nx run-many`,
`nx affected`) over the underlying tooling.

## Commands

```bash
npm install            # install dependencies
npm start              # Docusaurus site + hot-reloading demo (nx run website:start)

npm test               # all tests (nx run-many -t test)
npm run lint           # lint (nx run-many -t lint)
npm run format         # nx format:write

npm run build:lib      # build the library → dist/libs/react-mosaic-component/
npm run build:site     # build the docs site → apps/website/build/
npm run build-lib:check # type-check only: tsc -p tsconfig.lib.json --noEmit

npm run release        # lint + test, then nx release (version, changelog, tag; publish via CI)
```

Scoped / watch runs go through Nx:

```bash
npx nx test react-mosaic-component            # just the library's tests
npx nx test react-mosaic-component --watch    # watch mode
npm test -- --testNamePattern="Tree"          # filter by test name
```

Git hooks are installed by `lefthook` (via the `prepare` script) — lint/format
run on commit. Node 18+ is required.

## Testing

- **Framework:** Vitest + Testing Library, `jsdom` environment.
- **Location:** co-located `*.spec.ts` / `*.spec.tsx` next to the source.
- **Utility tests** live in `src/lib/util/*.spec.ts` (`mosaicUtilities`, `mosaicUpdates`, `boundingBox`).
- **Component tests** render through `@testing-library/react`; `<Mosaic>` provides its own DnD context, and you can capture `MosaicContext.mosaicActions` from a tile to drive lifecycle actions directly (see `src/lib/Mosaic.spec.tsx`).
- Always cover the edge cases mosaic cares about: **empty tree, single node, deeply nested tree, and maximum depth.**
- Add a regression test with every bug fix.

## Build system

- **Library** (`tsup` + `vite.config.ts`): emits ESM (`index.mjs`), CJS (`index.cjs`), types (`index.d.ts`), and CSS (LESS → autoprefixed `react-mosaic-component.css`), plus `package.json`/`README` copy.
- **Docs site** (`apps/website`, Docusaurus): `docusaurus-plugin-typedoc` regenerates the API docs from source, then bundles docs + landing + the `/demo` route. The demo aliases `react-mosaic-component` to the prebuilt `dist/libs/react-mosaic-component/index.mjs`, so `build:lib` must run first — Nx's `implicitDependencies` handles the ordering.
- The live demo lives at `apps/website/src/components/Demo/` — use it for manual/visual verification.

## Git & PR workflow

- **Conventional commits**; keep commits focused and atomic.
- Branch off `master` with a descriptive name, e.g. `feature/add-keyboard-shortcuts`.
- PRs: reference related issues, describe the change, **attach screenshots for any UI change**, and make sure CI is green.

## CI/CD (`.github/workflows/`)

- `deployment.yml` — builds the library then the docs site and deploys to GitHub Pages on push to `master`.
- `publish.yaml` — publishes the library to NPM on a new release.
- `claude.yml` — Claude Code assistance on `@claude` mentions.

## Troubleshooting

- **Build failures:** clear `dist/` and `node_modules/.cache/`, re-run `npm install`, confirm Node 18+.
- **Type errors:** `npm run build-lib:check` for the full report.
- **Test failures:** run the single file/name to isolate; use `waitFor` for async; `jsdom` is the environment.
- **Styling:** ensure the library CSS is imported; if using Blueprint, load its CSS too; confirm LESS compiled.
- **Drag not working:** verify the `Mosaic` DnD provider/backend is set up.
