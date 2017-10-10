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
import '@blueprintjs/core/dist/blueprint.css';
import * as _ from 'lodash';
import * as React from 'react';
import { MosaicWindowContext } from '../src/contextTypes';
import {
  Corner,
  createBalancedTreeFromLeaves,
  getLeaves,
  getNodeAtPath,
  getOtherDirection,
  getPathToCorner,
  MosaicNode,
  MosaicParent,
  updateTree,
} from '../src/index';
import { Mosaic } from '../src/Mosaic';
import { MosaicWindow } from '../src/MosaicWindow';
import { MosaicZeroState } from '../src/MosaicZeroState';
import { MosaicDirection } from '../src/types';
import '../styles/index.less';
import './example.less';

let windowCount = 4;

class CloseAdditionalControlsButton extends React.PureComponent {
  static contextTypes = MosaicWindowContext;
  context: MosaicWindowContext<number>;

  render() {
    return (
      <div className='pt-button-group pt-minimal'>
        <button
          onClick={() => this.context.mosaicWindowActions.setAdditionalControlsOpen(false)}
          className='pt-button'
        >
          Proof of Concept Button!
        </button>
      </div>
    );
  }
}

export const THEMES = {
  ['Blueprint']: 'mosaic-blueprint-theme',
  ['Blueprint Dark']: 'mosaic-blueprint-theme pt-dark',
  ['None']: '',
};

export type Theme = keyof typeof THEMES;

const additionalControls = React.Children.toArray([
  <CloseAdditionalControlsButton/>,
]);

export interface ExampleAppState {
  currentNode: MosaicNode<number> | null;
  currentTheme: Theme;
}

class NumberMosaic extends Mosaic<number> {
}

class NumberMosaicWindow extends MosaicWindow<number> {
}

export class ExampleApp extends React.PureComponent<{}, ExampleAppState> {
  state: ExampleAppState = {
    currentNode: createBalancedTreeFromLeaves(_.range(1, windowCount + 1)),
    currentTheme: 'Blueprint',
  };

  render() {
    return (
      <div className='react-mosaic-example-app'>
        {this.renderNavBar()}
        <NumberMosaic
          renderTile={(count: number) => (
            <NumberMosaicWindow
              additionalControls={count === 3 ? additionalControls : []}
              title={`Window ${count}`}
              createNode={this.createNode}
            >
              <div className='example-window'>
                <h1>{`Window ${count}`}</h1>
              </div>
            </NumberMosaicWindow>
          )}
          zeroStateView={<MosaicZeroState createNode={this.createNode}/>}
          value={this.state.currentNode}
          onChange={this.onChange}
          className={THEMES[this.state.currentTheme]}
        />
      </div>
    );
  }

  private onChange = (currentNode: MosaicNode<number>) => this.setState({ currentNode });

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

      currentNode = updateTree(currentNode, [{
        path,
        spec: {
          $set: {
            direction, first, second,
          },
        },
      }]);
    } else {
      currentNode = ++windowCount;
    }

    this.setState({ currentNode });
  };

  private renderNavBar() {
    return (
      <div className='pt-navbar pt-dark'>
        <div className='pt-navbar-group'>
          <div className='pt-logo'/>
          <div className='pt-navbar-heading'>
            <a
              className='pt-app-title'
              href='https://github.com/palantir/react-mosaic'
            >
              react-mosaic
            </a>
          </div>
        </div>
        <div className='pt-navbar-group pt-button-group'>
          <label className='pt-label pt-inline theme-selection'>
            Theme:
            <div className='pt-select'>
              <select
                value={this.state.currentTheme}
                onChange={(e) => this.setState({ currentTheme: e.currentTarget.value as Theme })}
              >
                {React.Children.toArray(Object.keys(THEMES).map((label) => <option>{label}</option>))}
              </select>
            </div>
          </label>
          <div className='navbar-separator'/>
          <span className='actions-label'>Example Actions:</span>
          <button
            className='pt-button pt-icon-grid-view'
            onClick={this.autoArrange}
          >
            Auto Arrange
          </button>
          <button
            className='pt-button pt-icon-arrow-top-right'
            onClick={this.addToTopRight}
          >
            Add Window to Top Right
          </button>
        </div>
      </div>
    );
  }
}
