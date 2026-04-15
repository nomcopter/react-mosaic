import type { SidebarsConfig } from '@docusaurus/plugin-content-docs';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const typedocSidebar: unknown[] = require('./docs/api/typedoc-sidebar.cjs');

// The docs sidebar combines hand-authored guide content with the
// typedoc-generated API reference. The API section is entirely generated —
// `docusaurus-plugin-typedoc` regenerates `docs/api/**` on every build so it
// cannot drift from the actual library exports.
const sidebars: SidebarsConfig = {
  docsSidebar: [
    'intro',
    {
      type: 'category',
      label: 'Concepts',
      collapsed: false,
      items: [
        'concepts/tree-structure',
        'concepts/controlled-vs-uncontrolled',
        'concepts/tabs',
        'concepts/updates',
      ],
    },
    {
      type: 'category',
      label: 'Guides',
      collapsed: false,
      items: [
        'guides/custom-toolbar',
        'guides/persisting-layout',
        'guides/theming',
        'guides/zero-state',
      ],
    },
    {
      type: 'category',
      label: 'Migration',
      items: ['migration/from-v6'],
    },
    {
      type: 'category',
      label: 'API Reference',
      link: { type: 'doc', id: 'api/index' },
      items: typedocSidebar as SidebarsConfig['docsSidebar'],
    },
  ],
};

export default sidebars;
