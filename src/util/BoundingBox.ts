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
import { MosaicDirection } from '../types';
import { assertNever } from './assertNever';

// Each of these values is like the CSS property of the same name in percentages
export interface BoundingBox {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export namespace BoundingBox {
  export function empty() {
    return {
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
    };
  }

  export interface Split {
    first: BoundingBox;
    second: BoundingBox;
  }

  export interface Styles {
    top: string;
    right: string;
    bottom: string;
    left: string;
  }

  export function split(boundingBox: BoundingBox, relativeSplitPercentage: number, direction: MosaicDirection): Split {
    const absolutePercentage = getAbsoluteSplitPercentage(boundingBox, relativeSplitPercentage, direction);
    if (direction === 'column') {
      return {
        first: {
          ...boundingBox,
          bottom: 100 - absolutePercentage,
        },
        second: {
          ...boundingBox,
          top: absolutePercentage,
        },
      };
    } else if (direction === 'row') {
      return {
        first: {
          ...boundingBox,
          right: 100 - absolutePercentage,
        },
        second: {
          ...boundingBox,
          left: absolutePercentage,
        },
      };
    } else {
      return assertNever(direction);
    }
  }

  export function getAbsoluteSplitPercentage(
    boundingBox: BoundingBox,
    relativeSplitPercentage: number,
    direction: MosaicDirection,
  ): number {
    const { top, right, bottom, left } = boundingBox;
    if (direction === 'column') {
      const height = 100 - top - bottom;
      return height * relativeSplitPercentage / 100 + top;
    } else if (direction === 'row') {
      const width = 100 - right - left;
      return width * relativeSplitPercentage / 100 + left;
    } else {
      return assertNever(direction);
    }
  }

  export function getRelativeSplitPercentage(
    boundingBox: BoundingBox,
    absoluteSplitPercentage: number,
    direction: MosaicDirection,
  ): number {
    const { top, right, bottom, left } = boundingBox;
    if (direction === 'column') {
      const height = 100 - top - bottom;
      return (absoluteSplitPercentage - top) / height * 100;
    } else if (direction === 'row') {
      const width = 100 - right - left;
      return (absoluteSplitPercentage - left) / width * 100;
    } else {
      return assertNever(direction);
    }
  }

  export function asStyles({ top, right, bottom, left }: BoundingBox): Styles {
    return {
      top: `${top}%`,
      right: `${right}%`,
      bottom: `${bottom}%`,
      left: `${left}%`,
    };
  }
}
