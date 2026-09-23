import React from 'react';
import { afterEach, describe, expect, expectTypeOf, it, vi } from 'vitest';
import { cleanup, render } from '@testing-library/react';

import { useMosaic, useMosaicWindow } from './contextHooks';
import { MosaicRootActions } from './contextTypes';
import { Mosaic } from './Mosaic';
import { MosaicWindow } from './MosaicWindow';
import { MosaicNode, MosaicPath } from './types';

type PanelId = 'a' | 'b';

const TREE: MosaicNode<PanelId> = {
  type: 'split',
  direction: 'row',
  children: ['a', 'b'],
};

describe('context hooks', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('useMosaic returns the enclosing Mosaic context with the key type', () => {
    const seen: { mosaicId: string; root: MosaicNode<PanelId> | null }[] = [];

    function Probe() {
      const { mosaicId, mosaicActions } = useMosaic<PanelId>();
      expectTypeOf(mosaicActions).toEqualTypeOf<MosaicRootActions<PanelId>>();
      seen.push({ mosaicId, root: mosaicActions.getRoot() });
      return null;
    }

    render(
      <Mosaic<PanelId>
        mosaicId="hooks-test"
        initialValue={TREE}
        renderTile={() => <Probe />}
      />,
    );

    expect(seen.length).toBeGreaterThan(0);
    expect(seen[0]).toEqual({ mosaicId: 'hooks-test', root: TREE });
  });

  it('useMosaicWindow returns the enclosing window actions', () => {
    const paths: MosaicPath[] = [];

    function Probe() {
      paths.push(useMosaicWindow().mosaicWindowActions.getPath());
      return null;
    }

    render(
      <Mosaic<PanelId>
        initialValue={TREE}
        renderTile={(id, path) => (
          <MosaicWindow<PanelId> path={path} title={id}>
            <Probe />
          </MosaicWindow>
        )}
      />,
    );

    expect(paths).toContainEqual([0]);
    expect(paths).toContainEqual([1]);
  });

  it('throws a clear error outside of a Mosaic', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);

    function Outside() {
      useMosaic();
      return null;
    }

    expect(() => render(<Outside />)).toThrow(
      'useMosaic must be used inside a <Mosaic>',
    );
  });

  it('throws a clear error outside of a MosaicWindow', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);

    function Outside() {
      useMosaicWindow();
      return null;
    }

    expect(() =>
      render(
        <Mosaic<PanelId> initialValue="a" renderTile={() => <Outside />} />,
      ),
    ).toThrow('useMosaicWindow must be used inside a <MosaicWindow>');
  });
});
