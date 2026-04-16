import * as fs from 'node:fs';
import * as path from 'node:path';
import { themes as prismThemes } from 'prism-react-renderer';
import type { Config } from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

// Resolve paths relative to this config file so the typedoc plugin works
// regardless of the directory docusaurus is invoked from (Nx runs it from
// the repo root, `npm start` runs it from apps/website).
// typedoc requires posix separators even on Windows (it treats paths as globs).
const siteDir = __dirname.replace(/\\/g, '/');
const repoRoot = path.resolve(__dirname, '../..').replace(/\\/g, '/');

// Stage Blueprint CSS + icon fonts into static/css/ so they can be served as
// ordinary static files rather than bundled into Docusaurus's site-wide JS/CSS
// pipeline. Bundling Blueprint via `import 'blueprint.css'` caused its
// unscoped `body { color: #1c2127 }` rule to clobber Docusaurus's dark-mode
// text colours — we defend against that in custom.css with a higher-specificity
// `html body` override. These files are then registered via the `stylesheets`
// config below so they load on every page (the docs pages host live-code
// examples that also use Blueprint icon classes).
const staticCssDir = path.join(__dirname, 'static', 'css');
fs.mkdirSync(staticCssDir, { recursive: true });
// Core + icons CSS.
fs.copyFileSync(
  `${repoRoot}/node_modules/@blueprintjs/core/lib/css/blueprint.css`,
  path.join(staticCssDir, 'blueprint.css'),
);
// blueprint-icons.css is just @font-face rules pointing at sibling font files
// via relative URLs — copy every asset in its lib/css directory so the fonts
// resolve when the stylesheet loads from /react-mosaic/css/.
const iconsDir = `${repoRoot}/node_modules/@blueprintjs/icons/lib/css`;
for (const file of fs.readdirSync(iconsDir)) {
  // Skip sourcemaps — we don't need them in the deployed site.
  if (file.endsWith('.map')) continue;
  fs.copyFileSync(path.join(iconsDir, file), path.join(staticCssDir, file));
}

const config: Config = {
  title: 'react-mosaic',
  tagline: 'A React tiling window manager',
  favicon: 'img/favicon.svg',

  // Set the production url of your site here
  url: 'https://nomcopter.github.io',
  // Pages is published under /react-mosaic/
  baseUrl: process.env.SITE_BASE_URL || '/react-mosaic/',

  organizationName: 'nomcopter',
  projectName: 'react-mosaic',
  trailingSlash: false,

  onBrokenLinks: 'warn',
  markdown: {
    hooks: {
      onBrokenMarkdownLinks: 'warn',
    },
  },

  // Load Blueprint site-wide — every page with a live mosaic example (docs
  // guides, /demo, tree-structure) renders toolbar buttons that pull glyphs
  // from Blueprint's icon font. Safe to load globally because custom.css
  // re-asserts Docusaurus body colours with higher specificity, neutralising
  // Blueprint's `body { color }` rule.
  stylesheets: [
    { href: 'css/blueprint.css' },
    { href: 'css/blueprint-icons.css' },
  ],

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          editUrl:
            'https://github.com/nomcopter/react-mosaic/tree/master/apps/website/',
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themes: ['@docusaurus/theme-live-codeblock'],

  plugins: [
    // Webpack alias so example code and the react-live scope can import
    // the library by its published package name — matches what users will
    // actually write. We point at the *built* ESM output rather than raw
    // source so Docusaurus' Babel pipeline doesn't have to compile TSX with
    // `declare` fields etc. Run `nx build react-mosaic-component` first.
    function webpackAliasPlugin() {
      const distDir = path.join(repoRoot, 'dist/libs/react-mosaic-component');
      return {
        name: 'webpack-alias-react-mosaic',
        configureWebpack() {
          return {
            resolve: {
              alias: {
                'react-mosaic-component$': path.join(distDir, 'index.mjs'),
                'react-mosaic-component/react-mosaic-component.css': path.join(
                  distDir,
                  'react-mosaic-component.css',
                ),
              },
            },
          };
        },
      };
    },
    [
      'docusaurus-plugin-typedoc',
      {
        // typedoc options — reads TSDoc from the library source
        entryPoints: [
          `${repoRoot}/libs/react-mosaic-component/src/lib/index.ts`,
        ],
        tsconfig: `${repoRoot}/libs/react-mosaic-component/tsconfig.lib.json`,
        // Output under docs/api so it appears inside the Docs sidebar.
        // Must be absolute — the typedoc plugin resolves `out` against the
        // current working directory, which is the repo root under Nx.
        out: `${siteDir}/docs/api`,
        // plugin-markdown options
        readme: 'none',
        excludePrivate: true,
        excludeInternal: true,
        githubPages: false,
        // Pin "Defined in" source links to `master` rather than the current
        // commit SHA — otherwise every rebuild bakes in a new commit that
        // becomes a 404 once the branch is deleted.
        gitRevision: 'master',
        sourceLinkTemplate:
          'https://github.com/nomcopter/react-mosaic/blob/master/{path}#L{line}',
        hideBreadcrumbs: false,
        hidePageHeader: false,
        // Sidebar integration — plugin emits a sidebar JSON Docusaurus can read
        sidebar: {
          pretty: true,
        },
      },
    ],
  ],

  themeConfig: {
    navbar: {
      title: 'react-mosaic',
      logo: {
        alt: 'react-mosaic',
        src: 'img/favicon.svg',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'docsSidebar',
          position: 'left',
          label: 'Docs',
        },
        { to: '/demo', label: 'Demo', position: 'left' },
        {
          href: 'https://www.npmjs.com/package/react-mosaic-component',
          label: 'npm',
          position: 'right',
        },
        {
          href: 'https://github.com/nomcopter/react-mosaic',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Docs',
          items: [
            { label: 'Getting started', to: '/docs/intro' },
            { label: 'Concepts', to: '/docs/concepts/tree-structure' },
            { label: 'Guides', to: '/docs/guides/custom-toolbar' },
            { label: 'API reference', to: '/docs/api' },
          ],
        },
        {
          title: 'Community',
          items: [
            {
              label: 'GitHub Issues',
              href: 'https://github.com/nomcopter/react-mosaic/issues',
            },
            {
              label: 'npm',
              href: 'https://www.npmjs.com/package/react-mosaic-component',
            },
          ],
        },
        {
          title: 'More',
          items: [
            { label: 'Demo', to: '/demo' },
            {
              label: 'GitHub',
              href: 'https://github.com/nomcopter/react-mosaic',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} react-mosaic contributors. Originally developed at Palantir Technologies, Inc.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['bash', 'diff', 'json', 'tsx'],
    },
    liveCodeBlock: {
      playgroundPosition: 'bottom',
    },
    colorMode: {
      defaultMode: 'light',
      respectPrefersColorScheme: true,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
