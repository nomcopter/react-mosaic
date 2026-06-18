import { expect } from 'chai';
import sinon from 'sinon';
import React from 'react';
import { render, cleanup, fireEvent, act } from '@testing-library/react';

import { ManagedMosaic, ManagedMosaicProps } from '../src/ManagedMosaic';
import { MosaicConfiguration, MosaicSchema, DEFAULT_MOSAIC_LABELS } from '../src/configuration/types';

// Minimal configuration used across tests
const PANEL_A = React.createElement('div', { className: 'panel-a' }, 'Panel A content');
const PANEL_B = React.createElement('div', { className: 'panel-b' }, 'Panel B content');
const PANEL_C = React.createElement('div', { className: 'panel-c' }, 'Panel C content');

const BASE_CONFIG: MosaicConfiguration = {
  key: 'test-mosaic',
  defaultViewKey: 'default',
  components: {
    a: { title: 'Panel A', component: PANEL_A },
    b: { title: 'Panel B', component: PANEL_B },
    c: { title: 'Panel C', component: PANEL_C },
  },
  views: {
    default: {
      layout: { direction: 'row', first: 'a', second: 'b' },
    },
    locked: {
      layout: { direction: 'row', first: 'a', second: 'b' },
      lockComponents: ['a'],
    },
  },
};

function renderManagedMosaic(
  schema: MosaicSchema,
  overrides: Partial<ManagedMosaicProps> = {},
  config: MosaicConfiguration = BASE_CONFIG,
) {
  const onChange = sinon.spy();
  const result = render(
    React.createElement(ManagedMosaic, {
      configuration: config,
      value: schema,
      currentViewKey: 'default',
      onChange,
      ...overrides,
    }),
  );
  return { ...result, onChange };
}

afterEach(() => {
  cleanup();
  sinon.restore();
});

describe('ManagedMosaic', () => {
  describe('Basic rendering', () => {
    it('should render without errors for a single-leaf schema', () => {
      const { container } = renderManagedMosaic('a');
      expect(container.querySelector('.mosaic')).to.not.equal(null);
    });

    it('should render without errors for a two-panel schema', () => {
      const { container } = renderManagedMosaic({ direction: 'row', first: 'a', second: 'b' });
      expect(container.querySelector('.mosaic')).to.not.equal(null);
    });

    it('should render component content for a single panel', () => {
      const { container } = renderManagedMosaic('a');
      expect(container.querySelector('.panel-a')).to.not.equal(null);
    });

    it('should render both panels for a two-panel schema', () => {
      const { container } = renderManagedMosaic({ direction: 'row', first: 'a', second: 'b' });
      expect(container.querySelector('.panel-a')).to.not.equal(null);
      expect(container.querySelector('.panel-b')).to.not.equal(null);
    });

    it('should render a null/zero-state for a null schema', () => {
      const { container } = renderManagedMosaic(null);
      expect(container.querySelector('.mosaic')).to.not.equal(null);
    });
  });

  describe('Toolbar rendering', () => {
    it('should render toolbar with panel title', () => {
      const { container } = renderManagedMosaic('a');
      const titles = Array.from(container.querySelectorAll('.mosaic-window-title'));
      expect(titles.some((el) => el.textContent === 'Panel A')).to.equal(true);
    });

    it('should render expand button in toolbar', () => {
      const { container } = renderManagedMosaic('a');
      expect(container.querySelector('.mosaic-toolbar-btn[title="Expand"]')).to.not.equal(null);
    });

    it('should render fullscreen button in toolbar', () => {
      const { container } = renderManagedMosaic('a');
      expect(container.querySelector('.mosaic-toolbar-btn[title="Fullscreen"]')).to.not.equal(null);
    });

    it('should NOT render remove button for the last (only) active panel', () => {
      const { container } = renderManagedMosaic('a');
      expect(container.querySelector('.mosaic-toolbar-btn[title="Remove panel"]')).to.equal(null);
    });

    it('should render remove button when multiple panels exist', () => {
      const { container } = renderManagedMosaic({ direction: 'row', first: 'a', second: 'b' });
      const removeBtns = container.querySelectorAll('.mosaic-toolbar-btn[title="Remove panel"]');
      expect(removeBtns.length).to.be.greaterThan(0);
    });
  });

  describe('Undefined component handling', () => {
    it('should show undefined component title for an unknown key', () => {
      const schema: MosaicSchema = 'unknown-key';
      const { container } = renderManagedMosaic(schema);
      const titles = Array.from(container.querySelectorAll('.mosaic-window-title'));
      expect(titles.some((el) => el.textContent === DEFAULT_MOSAIC_LABELS.undefinedComponentTitle)).to.equal(true);
    });

    it('should show undefined component content for an unknown key', () => {
      const schema: MosaicSchema = 'unknown-key';
      const { container } = renderManagedMosaic(schema);
      expect(container.querySelector('.mosaic-undefined-component')).to.not.equal(null);
    });
  });

  describe('Label overrides', () => {
    it('should use custom label for expandTooltip', () => {
      const { container } = renderManagedMosaic('a', {
        labels: { expandTooltip: 'Vergrößern' },
      });
      expect(container.querySelector('.mosaic-toolbar-btn[title="Vergrößern"]')).to.not.equal(null);
    });

    it('should use custom label for fullscreenTooltip', () => {
      const { container } = renderManagedMosaic('a', {
        labels: { fullscreenTooltip: 'Vollbild' },
      });
      expect(container.querySelector('.mosaic-toolbar-btn[title="Vollbild"]')).to.not.equal(null);
    });

    it('should fall back to defaults for omitted labels', () => {
      const { container } = renderManagedMosaic({ direction: 'row', first: 'a', second: 'b' }, {
        labels: { expandTooltip: 'Vergrößern' },
      });
      expect(container.querySelector('.mosaic-toolbar-btn[title="Remove panel"]')).to.not.equal(null);
    });
  });

  describe('Fullscreen overlay', () => {
    it('should NOT show overlay initially', () => {
      const { container } = renderManagedMosaic('a');
      expect(container.querySelector('.mosaic-fs-overlay')).to.equal(null);
    });

    it('should show overlay after clicking fullscreen button', () => {
      const { container } = renderManagedMosaic('a');
      const btn = container.querySelector('.mosaic-toolbar-btn[title="Fullscreen"]') as HTMLElement;
      fireEvent.click(btn);
      expect(container.querySelector('.mosaic-fs-overlay')).to.not.equal(null);
    });

    it('should show the tile title in the fullscreen overlay', () => {
      const { container } = renderManagedMosaic('a');
      const btn = container.querySelector('.mosaic-toolbar-btn[title="Fullscreen"]') as HTMLElement;
      fireEvent.click(btn);
      const title = container.querySelector('.mosaic-fs-title');
      expect(title).to.not.equal(null);
      expect(title!.textContent).to.equal('Panel A');
    });

    it('should close overlay when close button is clicked', () => {
      const { container } = renderManagedMosaic('a');
      const btn = container.querySelector('.mosaic-toolbar-btn[title="Fullscreen"]') as HTMLElement;
      fireEvent.click(btn);
      const closeBtn = container.querySelector('.mosaic-fs-close') as HTMLElement;
      fireEvent.click(closeBtn);
      expect(container.querySelector('.mosaic-fs-overlay')).to.equal(null);
    });

    it('should close overlay on Escape key', () => {
      const { container } = renderManagedMosaic('a');
      const btn = container.querySelector('.mosaic-toolbar-btn[title="Fullscreen"]') as HTMLElement;
      fireEvent.click(btn);

      act(() => {
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      });

      expect(container.querySelector('.mosaic-fs-overlay')).to.equal(null);
    });
  });

  describe('Style variants', () => {
    it('should apply transparent-bg class when transparentBackground is set', () => {
      const config: MosaicConfiguration = { ...BASE_CONFIG, style: { transparentBackground: true } };
      const { container } = renderManagedMosaic('a', {}, config);
      expect(container.querySelector('.mosaic.transparent-bg')).to.not.equal(null);
    });

    it('should apply no-bg class when noBackground is set', () => {
      const config: MosaicConfiguration = { ...BASE_CONFIG, style: { noBackground: true } };
      const { container } = renderManagedMosaic('a', {}, config);
      expect(container.querySelector('.mosaic.no-bg')).to.not.equal(null);
    });

    it('should apply multiple style classes together', () => {
      const config: MosaicConfiguration = { ...BASE_CONFIG, style: { noBorder: true, glassBackground: true } };
      const { container } = renderManagedMosaic('a', {}, config);
      const mosaic = container.querySelector('.mosaic');
      expect(mosaic!.className).to.include('no-border');
      expect(mosaic!.className).to.include('glass-bg');
    });

    it('should apply no className when style is undefined', () => {
      const config: MosaicConfiguration = { ...BASE_CONFIG, style: undefined };
      const { container } = renderManagedMosaic('a', {}, config);
      const mosaic = container.querySelector('.mosaic');
      // Only the base mosaic class should be present
      expect(mosaic!.className).to.not.include('transparent-bg');
      expect(mosaic!.className).to.not.include('no-bg');
    });
  });

  describe('Locked panels', () => {
    it('should not render remove button for a locked component', () => {
      const { container } = renderManagedMosaic(
        { direction: 'row', first: 'a', second: 'b' },
        { currentViewKey: 'locked' },
      );
      // 'a' is locked — its tile should not have a remove button.
      // We can verify by checking count: only 'b' should have one.
      const removeBtns = container.querySelectorAll('.mosaic-toolbar-btn[title="Remove panel"]');
      expect(removeBtns.length).to.equal(1);
    });
  });

  describe('hideToolbar style', () => {
    it('should render the toolbar indicator button when hideToolbar is set', () => {
      const config: MosaicConfiguration = { ...BASE_CONFIG, style: { hideToolbar: true } };
      const { container } = renderManagedMosaic('a', {}, config);
      expect(container.querySelector('.mosaic-toolbar-indicator')).to.not.equal(null);
    });

    it('should NOT render toolbar indicator button when hideToolbar is not set', () => {
      const { container } = renderManagedMosaic('a');
      expect(container.querySelector('.mosaic-toolbar-indicator')).to.equal(null);
    });

    it('should toggle toolbar-open class when indicator is clicked', () => {
      const config: MosaicConfiguration = { ...BASE_CONFIG, style: { hideToolbar: true } };
      const { container } = renderManagedMosaic('a', {}, config);
      const indicator = container.querySelector('.mosaic-toolbar-indicator') as HTMLElement;
      fireEvent.click(indicator);
      expect(container.querySelector('.toolbar-open')).to.not.equal(null);
    });
  });

  describe('Value synchronization', () => {
    it('should update rendered tiles when value prop changes', () => {
      const onChange = sinon.spy();
      const { container, rerender } = render(
        React.createElement(ManagedMosaic, {
          configuration: BASE_CONFIG,
          value: 'a' as MosaicSchema,
          currentViewKey: 'default',
          onChange,
        }),
      );

      expect(container.querySelector('.panel-a')).to.not.equal(null);
      expect(container.querySelector('.panel-b')).to.equal(null);

      rerender(
        React.createElement(ManagedMosaic, {
          configuration: BASE_CONFIG,
          value: 'b' as MosaicSchema,
          currentViewKey: 'default',
          onChange,
        }),
      );

      expect(container.querySelector('.panel-b')).to.not.equal(null);
    });
  });
});
