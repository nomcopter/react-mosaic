import React from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render } from '@testing-library/react';

import { Mosaic } from '../Mosaic';
import { MosaicWindow } from '../MosaicWindow';
import { CreateNode } from '../types';

function renderTabs(createNode?: CreateNode<string>) {
  return render(
    <Mosaic<string>
      initialValue={{ type: 'tabs', tabs: ['a', 'b'], activeTabIndex: 0 }}
      createNode={createNode}
      renderTile={(id, path) => (
        <MosaicWindow<string> path={path} title={id}>
          <div>{id}</div>
        </MosaicWindow>
      )}
    />,
  );
}

describe('DefaultAddTabButton', () => {
  afterEach(cleanup);

  it('is hidden when Mosaic has no createNode, since it could not add anything', () => {
    const { container } = renderTabs();
    expect(container.querySelector('.mosaic-tab-add-button')).toBeNull();
  });

  it('is shown when Mosaic has createNode', () => {
    const { container } = renderTabs(() => 'new');
    expect(container.querySelector('.mosaic-tab-add-button')).not.toBeNull();
  });
});
