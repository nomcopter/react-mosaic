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
import * as React from 'react';
import * as _ from 'lodash';
import * as PureRenderDecorator from 'pure-render-decorator';
import {
    MosaicFactory,
    MosaicWindowFactory,
    Corner,
    MosaicNode,
    MosaicParent,
    MosaicZeroStateFactory,
    createBalancedTreeFromLeaves,
    getLeaves,
    getOtherDirection,
    getNodeAtPath,
    getPathToCorner,
    updateTree
} from '../src/index';
import './example.less';
import '../src/index.less';
import '@blueprintjs/core/dist/blueprint.css';
import { MosaicDirection } from '../src/types';

const { div, h1, a, button, span } = React.DOM;

let windowCount = 4;

class NoOpButton extends React.Component<{}, void> {
    render() {
        return div({ className: 'pt-button-group pt-minimal' },
            button({ className: 'pt-button' }, 'Proof of Concept Button!')
        );
    }
}
const additionalControls = [
    React.createElement(NoOpButton, { key: 'no-op' })
];

interface Props {

}

interface State {
    currentNode: MosaicNode<number> | null;
}

@PureRenderDecorator
class ExampleAppClass extends React.Component<Props, State> {
    state: State = {
        currentNode: createBalancedTreeFromLeaves(_.range(1, windowCount + 1))
    };

    render() {
        return div({ className: 'react-mosaic-example-app' },
            div({ className: 'pt-navbar pt-dark' },
                div({ className: 'pt-navbar-group pt-align-left' },
                    div({ className: 'pt-logo' }),
                    div({ className: 'pt-navbar-heading' },
                        a({
                            className: 'pt-app-title',
                            href: 'https://github.com/palantir/react-mosaic'
                        }, 'react-mosaic')
                    )
                ),
                div({ className: 'pt-navbar-group pt-align-right pt-button-group' },
                    span({ className: 'actions-label' }, 'Example Actions:'),
                    button({
                        className: 'pt-button pt-icon-grid-view',
                        onClick: this.autoArrange,
                    }, 'Auto Arrange'),
                    button({
                        className: 'pt-button pt-icon-arrow-top-right',
                        onClick: this.addToTopRight,
                    }, 'Add Window to Top Right')
                )
            ),
            MosaicFactory<number>({
                elementRetriever: (count: number) => MosaicWindowFactory<number>({
                        additionalControls: count === 3 ? additionalControls : [],
                        title: `Window ${count}`,
                        createNode: this.createNode
                    },
                    div({ className: 'example-window' },
                        h1({}, `Window ${count}`)
                    )
                ),
                zeroStateView: MosaicZeroStateFactory({
                    createNode: this.createNode
                }),
                value: this.state.currentNode,
                onChange: this.onChange
            })
        );
    }

    private onChange = (currentNode: MosaicNode<number>) => this.setState({ currentNode });

    private createNode = () => ++windowCount;

    private autoArrange = () => {
        const leaves = getLeaves(this.state.currentNode);

        this.setState({
            currentNode: createBalancedTreeFromLeaves(leaves)
        })
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
                        direction, first, second
                    }
                }
            }]);
        } else {
            currentNode = ++windowCount;
        }

        this.setState({ currentNode });
    }
}

export const ExampleApp = React.createFactory(ExampleAppClass);
