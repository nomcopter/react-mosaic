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
import { expect } from 'chai';
import * as _ from 'lodash';
import { getNodeAtPath, MosaicNode } from '../src/index';
import {
    Corner,
    createBalancedTreeFromLeaves,
    getAndAssertNodeAtPathExists,
    getLeaves,
    getPathToCorner,
    isParent,
} from '../src/mosaicUtilities';

const ROOT_ONLY_TREE: MosaicNode<number> = 1;
const MEDIUM_TREE: MosaicNode<number> = {
    direction: 'row',
    first: 1,
    second: {
        direction: 'column',
        first: {
            direction: 'column',
            first: 2,
            second: 3,
        },
        second: 4,
    },
};

const NINE_LEAVES = _.range(1, 10);
const THOUSAND_AND_ONE_LEAVES = _.range(1, 1002);

const NUMERICAL_SORT = (a: number, b: number) => (a - b);

function getTreeDepths(tree: MosaicNode<any>): { min: number, max: number } {
    if (isParent(tree)) {
        const first = getTreeDepths(tree.first);
        const second = getTreeDepths(tree.second);
        return {
            min: _.min([first.min, second.min]) + 1,
            max: _.max([first.max, second.max]) + 1,
        };
    } else {
        return {
            min: 0,
            max: 0,
        };
    }
}

describe('mosaicUtilities', () => {
    describe('getNodeAtPath', () => {
        it('should get root', () => {
            expect(getNodeAtPath(MEDIUM_TREE, [])).to.equal(MEDIUM_TREE);
        });
        it('should get MosaicParent', () => {
            expect(getNodeAtPath(MEDIUM_TREE, ['second'])).to.equal(MEDIUM_TREE.second);
        });
        it('should get leaf', () => {
            expect(getNodeAtPath(MEDIUM_TREE, ['second', 'first', 'second'])).to.equal(3);
        });
        it('should return null on incorrect path', () => {
            expect(getNodeAtPath(MEDIUM_TREE, ['second', 'first', 'second', 'first'])).to.equal(null);
        });
        it('should return null on null root', () => {
            expect(getNodeAtPath(null, ['second', 'first', 'second', 'first'])).to.equal(null);
        });
    });
    describe('getAndAssertNodeAtPathExists', () => {
        it('should get root', () => {
            expect(getAndAssertNodeAtPathExists(MEDIUM_TREE, [])).to.equal(MEDIUM_TREE);
        });
        it('should get MosaicParent', () => {
            expect(getAndAssertNodeAtPathExists(MEDIUM_TREE, ['second'])).to.equal(MEDIUM_TREE.second);
        });
        it('should get leaf', () => {
            expect(getAndAssertNodeAtPathExists(MEDIUM_TREE, ['second', 'first', 'second'])).to.equal(3);
        });
        it('should error on incorrect path', () => {
            expect(() => getAndAssertNodeAtPathExists(MEDIUM_TREE, ['second', 'first', 'second', 'first'])).to.throw(Error);
        });
        it('should error on null root', () => {
            expect(() => getAndAssertNodeAtPathExists(null, ['second', 'first', 'second', 'first'])).to.throw(Error);
        });
    });
    describe('getLeaves', () => {
        it('should get leaves of simple tree', () => {
            expect(getLeaves(ROOT_ONLY_TREE)).to.deep.equal([1]);
        });
        it('should get leaves of medium tree', () => {
            expect(getLeaves(MEDIUM_TREE).sort(NUMERICAL_SORT)).to.deep.equal([1, 2, 3, 4]);
        });
        it('should return empty array when provided an empty tree', () => {
            expect(getLeaves(null)).to.deep.equal([]);
        });
    });
    describe('createBalancedTreeFromLeaves', () => {
        it('should be balanced', () => {
            const tree = createBalancedTreeFromLeaves(NINE_LEAVES);
            const depths = getTreeDepths(tree);
            expect(depths.max - depths.min).to.be.lessThan(2);
        });
        it('should be balanced when huge', () => {
            const tree = createBalancedTreeFromLeaves(THOUSAND_AND_ONE_LEAVES);
            const depths = getTreeDepths(tree);
            expect(depths.max - depths.min).to.be.lessThan(2);
        });
        it('should include all leaves', () => {
            const tree = createBalancedTreeFromLeaves(THOUSAND_AND_ONE_LEAVES);
            const leaves = getLeaves(tree);
            expect(leaves.sort(NUMERICAL_SORT)).to.deep.equal(THOUSAND_AND_ONE_LEAVES);
        });
        it('should return empty tree when provided no leaves', () => {
            const tree = createBalancedTreeFromLeaves([]);
            expect(tree).to.equal(null);
        });
    });
    describe('getPathToCorner', () => {
        it('should get top left', () => {
            const path = getPathToCorner(MEDIUM_TREE, Corner.TOP_LEFT);
            expect(getNodeAtPath(MEDIUM_TREE, path)).to.equal(1);
        });
        it('should get top right', () => {
            const path = getPathToCorner(MEDIUM_TREE, Corner.TOP_RIGHT);
            expect(getNodeAtPath(MEDIUM_TREE, path)).to.equal(2);
        });
        it('should get bottom left', () => {
            const path = getPathToCorner(MEDIUM_TREE, Corner.BOTTOM_LEFT);
            expect(getNodeAtPath(MEDIUM_TREE, path)).to.equal(1);
        });
        it('should get bottom right', () => {
            const path = getPathToCorner(MEDIUM_TREE, Corner.BOTTOM_RIGHT);
            expect(getNodeAtPath(MEDIUM_TREE, path)).to.equal(4);
        });
    });
});
