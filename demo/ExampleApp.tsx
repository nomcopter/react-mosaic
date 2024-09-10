import { Classes, HTMLSelect } from '@blueprintjs/core';
import { IconNames } from '@blueprintjs/icons';
import classNames from 'classnames';
import { dropRight } from 'lodash-es';
import React from 'react';

import {
  Corner,
  createBalancedTreeFromLeaves,
  getLeaves,
  getNodeAtPath,
  getOtherDirection,
  getPathToCorner,
  Mosaic,
  MosaicBranch,
  MosaicDirection,
  MosaicNode,
  MosaicParent,
  MosaicWindow,
  MosaicZeroState,
  updateTree,
} from '../src';

import { CloseAdditionalControlsButton } from './CloseAdditionalControlsButton';

import '@blueprintjs/core/lib/css/blueprint.css';
import '@blueprintjs/icons/lib/css/blueprint-icons.css';
import '../styles/index.less';
import './carbon.less';
import './example.less';

// tslint:disable no-console

// tslint:disable-next-line no-var-requires
const gitHubLogo = require('./GitHub-Mark-Light-32px.png');
// tslint:disable-next-line no-var-requires
const { version } = require('../package.json');

export const THEMES = {
  ['Blueprint']: 'mosaic-blueprint-theme',
  ['Blueprint Dark']: classNames('mosaic-blueprint-theme', Classes.DARK),
  ['None']: '',
};

export type Theme = keyof typeof THEMES;

const additionalControls = React.Children.toArray([<CloseAdditionalControlsButton />]);

const EMPTY_ARRAY: any[] = [];

export interface ExampleAppState {
  currentNode: MosaicNode<number> | null;
  currentTheme: Theme;
}

export class ExampleApp extends React.PureComponent<{}, ExampleAppState> {
  state: ExampleAppState = {
    currentNode: {
      direction: 'row',
      first: 1,
      second: {
        direction: 'column',
        first: 2,
        second: 3,
      },
      splitPercentage: 40,
    },
    currentTheme: 'Blueprint',
  };

  render() {
    const totalWindowCount = getLeaves(this.state.currentNode).length;
    return (
      <React.StrictMode>
        <div className="react-mosaic-example-app">
          {this.renderNavBar()}
          <Mosaic<number>
            renderTile={(count, path) => (
              <ExampleWindow count={count} path={path} totalWindowCount={totalWindowCount} />
            )}
            zeroStateView={<MosaicZeroState createNode={() => totalWindowCount + 1} />}
            value={this.state.currentNode}
            onChange={this.onChange}
            onRelease={this.onRelease}
            className={THEMES[this.state.currentTheme]}
            blueprintNamespace="bp4"
          />
        </div>
      </React.StrictMode>
    );
  }

  private onChange = (currentNode: MosaicNode<number> | null) => {
    this.setState({ currentNode });
  };

  private onRelease = (currentNode: MosaicNode<number> | null) => {
    console.log('Mosaic.onRelease():', currentNode);
  };

  private autoArrange = () => {
    const leaves = getLeaves(this.state.currentNode);

    this.setState({
      currentNode: createBalancedTreeFromLeaves(leaves),
    });
  };

  private addToTopRight = () => {
    let { currentNode } = this.state;
    const totalWindowCount = getLeaves(currentNode).length;
    if (currentNode) {
      const path = getPathToCorner(currentNode, Corner.TOP_RIGHT);
      const parent = getNodeAtPath(currentNode, dropRight(path)) as MosaicParent<number>;
      const destination = getNodeAtPath(currentNode, path) as MosaicNode<number>;
      const direction: MosaicDirection = parent ? getOtherDirection(parent.direction) : 'row';

      let first: MosaicNode<number>;
      let second: MosaicNode<number>;
      if (direction === 'row') {
        first = destination;
        second = totalWindowCount + 1;
      } else {
        first = totalWindowCount + 1;
        second = destination;
      }

      currentNode = updateTree(currentNode, [
        {
          path,
          spec: {
            $set: {
              direction,
              first,
              second,
            },
          },
        },
      ]);
    } else {
      currentNode = totalWindowCount + 1;
    }

    this.setState({ currentNode });
  };

  private renderNavBar() {
    return (
      <div className={classNames(Classes.NAVBAR, Classes.DARK)}>
        <div className={Classes.NAVBAR_GROUP}>
          <div className={Classes.NAVBAR_HEADING}>
            <a href="https://github.com/nomcopter/react-mosaic">
              react-mosaic <span className="version">v{version}</span>
            </a>
          </div>
        </div>
        <div className={classNames(Classes.NAVBAR_GROUP, Classes.BUTTON_GROUP)}>
          <label className={classNames('theme-selection', Classes.LABEL, Classes.INLINE)}>
            Theme:
            <HTMLSelect
              value={this.state.currentTheme}
              onChange={(e) => this.setState({ currentTheme: e.currentTarget.value as Theme })}
            >
              {React.Children.toArray(Object.keys(THEMES).map((label) => <option>{label}</option>))}
            </HTMLSelect>
          </label>
          <div className="navbar-separator" />
          <span className="actions-label">Example Actions:</span>
          <button
            className={classNames(Classes.BUTTON, Classes.iconClass(IconNames.GRID_VIEW))}
            onClick={this.autoArrange}
          >
            Auto Arrange
          </button>
          <button
            className={classNames(Classes.BUTTON, Classes.iconClass(IconNames.ARROW_TOP_RIGHT))}
            onClick={this.addToTopRight}
          >
            Add Window to Top Right
          </button>
          <a className="github-link" href="https://github.com/nomcopter/react-mosaic">
            <img src={gitHubLogo} />
          </a>
        </div>
      </div>
    );
  }
}

interface ExampleWindowProps {
  count: number;
  path: MosaicBranch[];
  totalWindowCount: number;
}

const ExampleWindow = ({ count, path, totalWindowCount }: ExampleWindowProps) => {
  const adContainer = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    if (adContainer.current == null) {
      return;
    }

    const script = document.createElement('script');

    script.src = '//cdn.carbonads.com/carbon.js?serve=CEAIEK3E&placement=nomcoptergithubio';
    script.async = true;
    script.type = 'text/javascript';
    script.id = '_carbonads_js';

    adContainer.current.appendChild(script);
  }, []);

  return (
    <MosaicWindow<number>
      additionalControls={count === 3 ? additionalControls : EMPTY_ARRAY}
      title={`Window ${count}`}
      createNode={() => totalWindowCount + 1}
      path={path}
      onDragStart={() => console.log('MosaicWindow.onDragStart')}
      onDragEnd={(type) => console.log('MosaicWindow.onDragEnd', type)}
      renderToolbar={count === 2 ? () => <div className="toolbar-example">Custom Toolbar</div> : null}
    >
      <div className="example-window">
        <h1>{`Window ${count}`}</h1>
        {count === 3 && <div className="ad-container" ref={adContainer} />}
      </div>
    </MosaicWindow>
  );
};
