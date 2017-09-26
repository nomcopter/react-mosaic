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
import { MosaicZeroState } from '../src/MosaicZeroState';
import { MosaicDirection } from '../src/types';
import { MosaicWindow } from '../src/MosaicWindow';
import '../styles/index.less';
import './example.less';

let windowCount = 4;

class NoOpButton extends React.PureComponent {
  render() {
    return (
      <div className='pt-button-group pt-minimal'>
        <button className='pt-button'>Proof of Concept Button!</button>
      </div>
    );
  }
}

const additionalControls = React.Children.toArray([
  <NoOpButton/>,
]);

interface State {
  currentNode: MosaicNode<number> | null;
}

class NumberMosaic extends Mosaic<number> { }
class NumberMosaicWindow extends MosaicWindow<number> { }

export class ExampleApp extends React.PureComponent<{}, State> {
  state: State = {
    currentNode: createBalancedTreeFromLeaves(_.range(1, windowCount + 1)),
  };

  render() {
    return (
      <div className='react-mosaic-example-app'>
        <div className='pt-navbar pt-dark'>
          <div className='pt-navbar-group pt-align-left'>
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
          <div className='pt-navbar-group pt-align-right pt-button-group'>
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
}
