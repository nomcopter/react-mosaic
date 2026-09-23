import { describe, expect, expectTypeOf, it } from 'vitest';

import {
  createDragToUpdates,
  type DropInfo,
  type EnabledResizeOptions,
  type MosaicDragItem,
  type MosaicDropData,
  MosaicDropTargetPosition,
  type MosaicKey,
  type MosaicNode,
  type MosaicProps,
  type ResizeOptions,
  updateTree,
} from './index';

describe('public API exports', () => {
  it('exports MosaicDropTargetPosition values', () => {
    expect(MosaicDropTargetPosition).toEqual({
      TOP: 'top',
      BOTTOM: 'bottom',
      LEFT: 'left',
      RIGHT: 'right',
    });
  });

  it('exports the DropInfo type taken by createDragToUpdates', () => {
    expectTypeOf<
      Parameters<typeof createDragToUpdates<string>>[3]
    >().toEqualTypeOf<DropInfo>();

    const tree: MosaicNode<string> = {
      type: 'split',
      direction: 'row',
      children: ['a', 'b'],
    };
    const dropInfo: DropInfo = {
      type: 'split',
      position: MosaicDropTargetPosition.LEFT,
    };

    expect(
      updateTree(tree, createDragToUpdates(tree, [1], [0], dropInfo)),
    ).toEqual(expect.objectContaining({ children: ['b', 'a'] }));
  });

  it('exports the resize option types used by MosaicProps', () => {
    expectTypeOf<MosaicProps<string>['resize']>().toEqualTypeOf<
      ResizeOptions | undefined
    >();
    expectTypeOf<EnabledResizeOptions>().toMatchTypeOf<ResizeOptions>();
  });

  it('exports drag and drop payload types', () => {
    expectTypeOf<MosaicKey>().toEqualTypeOf<string | number>();
    expectTypeOf<MosaicDragItem['mosaicId']>().toEqualTypeOf<string>();
    expectTypeOf<MosaicDropData['position']>().toEqualTypeOf<
      MosaicDropTargetPosition | undefined
    >();
  });
});
