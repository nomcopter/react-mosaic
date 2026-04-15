import { Classes, HTMLSelect } from '@blueprintjs/core';
import { IconNames } from '@blueprintjs/icons';
import classNames from 'classnames';
import update from 'immutability-helper';
import React, { useCallback, useMemo, useState } from 'react';

// Blueprint CSS is loaded site-wide via the `stylesheets` config in
// docusaurus.config.ts (pointing at static/css/ copies). We intentionally
// avoid `import '@blueprintjs/core/lib/css/blueprint.css'` here because
// Docusaurus/webpack extracts every such import into a single site-wide
// `styles.*.css` bundle, which would leak Blueprint's unscoped
// `body { color }` rule onto every page. custom.css defends against that
// with an `html body` override.
//
// react-mosaic-component.css is already loaded globally via custom.css @import
// (scoped to .mosaic-* selectors, so harmless). demo.css is also scoped and
// fine to keep as a static import.
import './demo.css';

// eslint-disable-next-line @nx/enforce-module-boundaries
import packageJson from '../../../../../libs/react-mosaic-component/package.json';

import {
  createBalancedTreeFromLeaves,
  getLeaves,
  Mosaic,
  MosaicNode,
  MosaicSplitNode,
  MosaicZeroState,
} from 'react-mosaic-component';

import { ExampleWindow } from './ExampleWindow';
import { EditableTabTitle } from './EditableTabTitle';
import { THEMES, Theme } from './demo-types';
import { createNode } from './demo-utils';

const version = packageJson.version;

// Initial layout showcases the n-ary tree shape added in v7:
//   - a 3-child `split` (n-ary — splitPercentages has 3 entries)
//   - a `tabs` node nested inside that split
//   - a further column `split` on the right
const INITIAL_TREE: MosaicNode<string> = {
  type: 'split',
  direction: 'row',
  splitPercentages: [25, 45, 30],
  children: [
    '1',
    {
      type: 'tabs',
      tabs: ['2', '3', '4'],
      activeTabIndex: 0,
    },
    {
      type: 'split',
      direction: 'column',
      splitPercentages: [60, 40],
      children: ['5', '6'],
    },
  ],
};

const INITIAL_TITLES: Record<string, string> = {
  '1': 'Dashboard',
  '2': 'Metrics',
  '3': 'Logs',
  '4': 'Traces',
  '5': 'Alerts',
  '6': 'Settings',
};

const DemoApp: React.FC = () => {
  const [currentNode, setCurrentNode] = useState<MosaicNode<string> | null>(
    INITIAL_TREE,
  );
  const [currentTheme, setCurrentTheme] = useState<Theme>('Blueprint');
  const [editableTitles, setEditableTitles] =
    useState<Record<string, string>>(INITIAL_TITLES);

  const updateTitle = useCallback((panelId: string, newTitle: string) => {
    setEditableTitles((titles) => ({ ...titles, [panelId]: newTitle }));
  }, []);

  const autoArrange = useCallback(() => {
    setCurrentNode((node) => createBalancedTreeFromLeaves(getLeaves(node)));
  }, []);

  // Adds a new panel to the root split, demonstrating the n-ary structure by
  // growing the children array instead of nesting a new binary split.
  const addWindow = useCallback(() => {
    setCurrentNode((node) => {
      const totalWindowCount = getLeaves(node).length;
      const newWindow = (totalWindowCount + 1).toString();

      if (!node) {
        return newWindow;
      }

      if (typeof node === 'object' && node.type === 'split') {
        const numChildren = node.children.length;
        return update(node, {
          children: { $push: [newWindow] },
          splitPercentages: {
            $set: Array(numChildren + 1).fill(100 / (numChildren + 1)),
          },
        });
      }

      // Root is a single panel or a tab group: wrap it in a new split.
      const nextRoot: MosaicSplitNode<string> = {
        type: 'split',
        direction: 'row',
        splitPercentages: [50, 50],
        children: [node, newWindow],
      };
      return nextRoot;
    });
  }, []);

  const renderTile = useCallback(
    (tileId: string, path: number[]) => (
      <ExampleWindow
        panelId={tileId}
        path={path}
        title={editableTitles[tileId] ?? `Panel ${tileId}`}
      />
    ),
    [editableTitles],
  );

  const renderTabTitle = useCallback(
    ({ tabKey }: { tabKey: string }) => (
      <EditableTabTitle
        key={tabKey}
        title={editableTitles[tabKey] ?? `Window ${tabKey}`}
        onUpdateTitle={(newTitle) => updateTitle(tabKey, newTitle)}
      />
    ),
    [editableTitles, updateTitle],
  );

  // Example close logic — exercises all three TabCloseState values so users
  // can see what they look like side-by-side.
  const canClose = useCallback(
    (
      tabKey: string,
      tabs: string[],
    ): 'canClose' | 'cannotClose' | 'noClose' => {
      if (tabKey === '2') return 'cannotClose'; // protected — button visible but disabled
      if (tabKey === '3') return 'noClose'; // button hidden entirely
      if (tabs.length <= 1) return 'cannotClose';
      return 'canClose';
    },
    [],
  );

  const zeroStateView = useMemo(() => <MosaicZeroState />, []);

  return (
    <div className="react-mosaic-example-app">
      <NavBar
        currentTheme={currentTheme}
        onThemeChange={setCurrentTheme}
        onAutoArrange={autoArrange}
        onAddWindow={addWindow}
      />
      <Mosaic<string>
        renderTile={renderTile}
        zeroStateView={zeroStateView}
        value={currentNode}
        onChange={setCurrentNode}
        createNode={createNode}
        className={THEMES[currentTheme]}
        blueprintNamespace="bp5"
        renderTabTitle={renderTabTitle}
        canClose={canClose}
      />
    </div>
  );
};

interface NavBarProps {
  currentTheme: Theme;
  onThemeChange: (theme: Theme) => void;
  onAutoArrange: () => void;
  onAddWindow: () => void;
}

const NavBar: React.FC<NavBarProps> = ({
  currentTheme,
  onThemeChange,
  onAutoArrange,
  onAddWindow,
}) => (
  <div className={classNames(Classes.NAVBAR, Classes.DARK)}>
    <div className={Classes.NAVBAR_GROUP}>
      <div className={Classes.NAVBAR_HEADING}>
        <a href="https://github.com/nomcopter/react-mosaic">
          react-mosaic <span className="version">v{version}</span>
        </a>
      </div>
    </div>
    <div className={classNames(Classes.NAVBAR_GROUP, Classes.BUTTON_GROUP)}>
      <label
        className={classNames('theme-selection', Classes.LABEL, Classes.INLINE)}
      >
        Theme:
        <HTMLSelect
          value={currentTheme}
          aria-label="Theme"
          onChange={(e) => onThemeChange(e.currentTarget.value as Theme)}
        >
          {Object.keys(THEMES).map((label) => (
            <option key={label}>{label}</option>
          ))}
        </HTMLSelect>
      </label>
      <div className="navbar-separator" />
      <span className="actions-label">Example Actions:</span>
      <button
        type="button"
        className={classNames(
          Classes.BUTTON,
          Classes.iconClass(IconNames.GRID_VIEW),
        )}
        onClick={onAutoArrange}
      >
        Auto Arrange
      </button>
      <button
        type="button"
        className={classNames(
          Classes.BUTTON,
          Classes.iconClass(IconNames.APPLICATION),
        )}
        onClick={onAddWindow}
      >
        Add Window
      </button>
      <a
        className="github-link"
        href="https://github.com/nomcopter/react-mosaic"
      >
        <img
          alt="react-mosaic on GitHub"
          title="Github Link"
          src="/react-mosaic/img/GitHub-Mark-Light-32px.png"
        />
      </a>
    </div>
  </div>
);

export default DemoApp;
