/**
 * @license
 * Copyright 2016 Palantir Technologies, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import _ from 'lodash';
import React from 'react';

import {
  Corner,
  createBalancedTreeFromLeaves,
  getLeaves,
  getNodeAtPath,
  getOtherDirection,
  getPathToCorner,
  Mosaic,
  MosaicDirection,
  MosaicNode,
  MosaicParent,
  MosaicWindow,
  MosaicZeroState,
  updateTree,
} from '../src';

import { CloseAdditionalControlsButton } from './CloseAdditionalControlsButton';

import '@blueprintjs/core/dist/blueprint.css';
import '../styles/index.less';
import './example.less';
// tslint:disable-next-line no-var-requires
const gitHubLogo = require('./GitHub-Mark-Light-32px.png');
// tslint:disable-next-line no-var-requires
const { version } = require('../package.json');

let windowCount = 3;

export const THEMES = {
  ['Blueprint']: 'mosaic-blueprint-theme',
  ['Blueprint Dark']: 'mosaic-blueprint-theme pt-dark',
  ['None']: '',
};

export type Theme = keyof typeof THEMES;

const additionalControls = React.Children.toArray([<CloseAdditionalControlsButton />]);

const EMPTY_ARRAY: any[] = [];

export interface ExampleAppState {
  currentNode: MosaicNode<number> | null;
  currentTheme: Theme;
}

const NumberMosaic = Mosaic.ofType<number>();
const NumberMosaicWindow = MosaicWindow.ofType<number>();

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
    return (
      <div className="react-mosaic-example-app">
        {this.renderNavBar()}
        <NumberMosaic
          renderTile={(count, path) => (
            <NumberMosaicWindow
              additionalControls={count === 3 ? additionalControls : EMPTY_ARRAY}
              title={`Window ${count}`}
              createNode={this.createNode}
              path={path}
            >
              <div className="example-window">
                <h1>{`Window ${count}`}</h1>
              </div>
            </NumberMosaicWindow>
          )}
          zeroStateView={<MosaicZeroState createNode={this.createNode} />}
          value={this.state.currentNode}
          onChange={this.onChange}
          className={THEMES[this.state.currentTheme]}
        />
      </div>
    );
  }

  private onChange = (currentNode: MosaicNode<number> | null) => this.setState({ currentNode });

  private createNode = () => ++windowCount;

  private autoArrange = () => {
    const leaves = getLeaves(this.state.currentNode);

    this.setState({
      currentNode: createBalancedTreeFromLeaves(leaves),
    });
  };

  private addToTopRight = () => {
    let { currentNode } = this.state;
    if (currentNode) {
      const path = getPathToCorner(currentNode, Corner.TOP_RIGHT);
      const parent = getNodeAtPath(currentNode, _.dropRight(path)) as MosaicParent<number>;
      const destination = getNodeAtPath(currentNode, path) as MosaicNode<number>;
      const direction: MosaicDirection = parent ? getOtherDirection(parent.direction) : 'row';

      let first: MosaicNode<number>;
      let second: MosaicNode<number>;
      if (direction === 'row') {
        first = destination;
        second = ++windowCount;
      } else {
        first = ++windowCount;
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
      currentNode = ++windowCount;
    }

    this.setState({ currentNode });
  };

  private renderNavBar() {
    return (
      <div className="pt-navbar pt-dark">
        <div className="pt-navbar-group">
          <div className="pt-logo" />
          <div className="pt-navbar-heading">
            <a className="pt-app-title" href="https://github.com/palantir/react-mosaic">
              react-mosaic <span className="version">v{version}</span>
            </a>
          </div>
        </div>
        <div className="pt-navbar-group pt-button-group">
          <label className="pt-label pt-inline theme-selection">
            Theme:
            <div className="pt-select">
              <select
                value={this.state.currentTheme}
                onChange={(e) => this.setState({ currentTheme: e.currentTarget.value as Theme })}
              >
                {React.Children.toArray(Object.keys(THEMES).map((label) => <option>{label}</option>))}
              </select>
            </div>
          </label>
          <div className="navbar-separator" />
          <span className="actions-label">Example Actions:</span>
          <button className="pt-button pt-icon-grid-view" onClick={this.autoArrange}>
            Auto Arrange
          </button>
          <button className="pt-button pt-icon-arrow-top-right" onClick={this.addToTopRight}>
            Add Window to Top Right
          </button>
          <a className="github-link" href="https://github.com/palantir/react-mosaic">
            <img src={gitHubLogo} />
          </a>
        </div>
      </div>
    );
  }
}
