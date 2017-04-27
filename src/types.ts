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

/**
 * Base type for the Mosaic binary tree
 */
export type MosaicNode<T> = MosaicParent<T> | T;

/**
 * Row means each window is side-by-side
 */
export type MosaicDirection = 'row' | 'column';

export interface MosaicParent<T> {
    direction: MosaicDirection;
    first: MosaicNode<T>;
    second: MosaicNode<T>;
    splitPercentage?: number;
}

export type MosaicBranch = 'first' | 'second';
export type MosaicPath = MosaicBranch[];

/**
 * Used by many utility methods to update the tree.
 * spec will be passed to https://github.com/kolodny/immutability-helper
 */
export interface MosaicUpdateSpec<T> {
    $set?: MosaicNode<T>;
    splitPercentage?: {
        $set: number | null;
    };
    direction?: {
        $set: MosaicDirection;
    };
    first?: MosaicUpdateSpec<T>;
    second?: MosaicUpdateSpec<T>;
}
export interface MosaicUpdate<T> {
    path: MosaicPath;
    spec: MosaicUpdateSpec<T>;
}

/**
 * Mosaic needs a way to resolve `T` into react elements for display.
 * This provides a way to look them up. If `T` is a `JSX.Element`, then this can simply be `_.identity`
 */
export type TileRenderer<T> = (t: T) => JSX.Element;

/**
 * Function that provides a new node to put into the tree
 */
export type CreateNode<T> = () => Promise<MosaicNode<T>> | MosaicNode<T>;

/**
 * Used by `react-dnd`
 * @type {{WINDOW: string}}
 */
export const MosaicDragType = {
    WINDOW: 'MosaicWindow',
};
