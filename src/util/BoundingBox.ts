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
    splitter: BoundingBox;
    second: BoundingBox;
  }

  export function split({ top, right, bottom, left }: BoundingBox,
                        splitPercentage: number, direction: MosaicDirection): Split {
    const width = 100 - right - left;
    const height = 100 - top - bottom;

    if (direction === 'column') {

    } else if (direction === 'row') {

    } else {
      assertNever(direction);
    }
  }
}
