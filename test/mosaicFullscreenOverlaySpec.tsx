import { expect } from 'chai';
import React from 'react';
import { render, cleanup, fireEvent } from '@testing-library/react';

import { MosaicFullscreenOverlay } from '../src/MosaicFullscreenOverlay';

afterEach(() => cleanup());

describe('MosaicFullscreenOverlay', () => {
  describe('Rendering', () => {
    it('should render the overlay backdrop', () => {
      const { container } = render(
        React.createElement(
          MosaicFullscreenOverlay,
          { title: 'My Panel', onClose: () => void 0 },
          React.createElement('div', { className: 'body-content' }, 'hello'),
        ),
      );
      expect(container.querySelector('.mosaic-fs-overlay')).to.not.equal(null);
    });

    it('should render the dialog element', () => {
      const { container } = render(
        React.createElement(
          MosaicFullscreenOverlay,
          { title: 'T', onClose: () => void 0 },
          'content',
        ),
      );
      expect(container.querySelector('.mosaic-fs-dialog')).to.not.equal(null);
    });

    it('should render the title', () => {
      const { container } = render(
        React.createElement(
          MosaicFullscreenOverlay,
          { title: 'Test Title', onClose: () => void 0 },
          'content',
        ),
      );
      expect(container.querySelector('.mosaic-fs-title')!.textContent).to.equal('Test Title');
    });

    it('should render children inside the body', () => {
      const { container } = render(
        React.createElement(
          MosaicFullscreenOverlay,
          { title: 'T', onClose: () => void 0 },
          React.createElement('div', { className: 'inner' }, 'inner content'),
        ),
      );
      expect(container.querySelector('.mosaic-fs-body .inner')).to.not.equal(null);
    });

    it('should render close button with default aria-label', () => {
      const { container } = render(
        React.createElement(
          MosaicFullscreenOverlay,
          { title: 'T', onClose: () => void 0 },
          'content',
        ),
      );
      const btn = container.querySelector('.mosaic-fs-close') as HTMLButtonElement;
      expect(btn).to.not.equal(null);
      expect(btn.getAttribute('aria-label')).to.equal('Close');
    });

    it('should use custom closeLabel on the close button', () => {
      const { container } = render(
        React.createElement(
          MosaicFullscreenOverlay,
          { title: 'T', onClose: () => void 0, closeLabel: 'Schließen' },
          'content',
        ),
      );
      const btn = container.querySelector('.mosaic-fs-close') as HTMLButtonElement;
      expect(btn.getAttribute('aria-label')).to.equal('Schließen');
    });
  });

  describe('Close interactions', () => {
    it('should call onClose when the close button is clicked', () => {
      let called = false;
      const { container } = render(
        React.createElement(
          MosaicFullscreenOverlay,
          { title: 'T', onClose: () => { called = true; } },
          'content',
        ),
      );
      const btn = container.querySelector('.mosaic-fs-close') as HTMLButtonElement;
      fireEvent.click(btn);
      expect(called).to.equal(true);
    });

    it('should call onClose when the backdrop is clicked', () => {
      let called = false;
      const { container } = render(
        React.createElement(
          MosaicFullscreenOverlay,
          { title: 'T', onClose: () => { called = true; } },
          'content',
        ),
      );
      const overlay = container.querySelector('.mosaic-fs-overlay') as HTMLElement;
      fireEvent.mouseDown(overlay);
      expect(called).to.equal(true);
    });

    it('should NOT call onClose when clicking inside the dialog', () => {
      let called = false;
      const { container } = render(
        React.createElement(
          MosaicFullscreenOverlay,
          { title: 'T', onClose: () => { called = true; } },
          React.createElement('div', { className: 'inner' }, 'safe'),
        ),
      );
      const dialog = container.querySelector('.mosaic-fs-dialog') as HTMLElement;
      fireEvent.mouseDown(dialog);
      expect(called).to.equal(false);
    });
  });
});
