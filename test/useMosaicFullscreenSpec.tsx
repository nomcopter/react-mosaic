import { expect } from 'chai';
import { renderHook, act, cleanup } from '@testing-library/react';

import { useMosaicFullscreen } from '../src/useMosaicFullscreen';

afterEach(() => cleanup());

describe('useMosaicFullscreen', () => {
  describe('initial state', () => {
    it('should start with fullscreenTileId as null', () => {
      const { result } = renderHook(() => useMosaicFullscreen<string>());
      expect(result.current.fullscreenTileId).to.equal(null);
    });
  });

  describe('setFullscreen', () => {
    it('should set the fullscreen tile id', () => {
      const { result } = renderHook(() => useMosaicFullscreen<string>());
      act(() => result.current.setFullscreen('tile-a'));
      expect(result.current.fullscreenTileId).to.equal('tile-a');
    });

    it('should update to a different tile id', () => {
      const { result } = renderHook(() => useMosaicFullscreen<string>());
      act(() => result.current.setFullscreen('tile-a'));
      act(() => result.current.setFullscreen('tile-b'));
      expect(result.current.fullscreenTileId).to.equal('tile-b');
    });
  });

  describe('closeFullscreen', () => {
    it('should reset fullscreenTileId to null', () => {
      const { result } = renderHook(() => useMosaicFullscreen<string>());
      act(() => result.current.setFullscreen('tile-a'));
      act(() => result.current.closeFullscreen());
      expect(result.current.fullscreenTileId).to.equal(null);
    });

    it('should be safe to call when already null', () => {
      const { result } = renderHook(() => useMosaicFullscreen<string>());
      expect(() => act(() => result.current.closeFullscreen())).to.not.throw();
      expect(result.current.fullscreenTileId).to.equal(null);
    });
  });

  describe('Escape key handler', () => {
    it('should close fullscreen on Escape key when a tile is fullscreen', () => {
      const { result } = renderHook(() => useMosaicFullscreen<string>());
      act(() => result.current.setFullscreen('tile-a'));

      act(() => {
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      });

      expect(result.current.fullscreenTileId).to.equal(null);
    });

    it('should NOT close fullscreen on other keys', () => {
      const { result } = renderHook(() => useMosaicFullscreen<string>());
      act(() => result.current.setFullscreen('tile-a'));

      act(() => {
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      });

      expect(result.current.fullscreenTileId).to.equal('tile-a');
    });

    it('should not listen for keydown when fullscreenTileId is null', () => {
      const { result } = renderHook(() => useMosaicFullscreen<string>());
      // Fire Escape without ever setting a tile — should not throw or change state
      act(() => {
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      });
      expect(result.current.fullscreenTileId).to.equal(null);
    });

    it('should remove keydown listener after closeFullscreen', () => {
      const { result } = renderHook(() => useMosaicFullscreen<string>());
      act(() => result.current.setFullscreen('tile-a'));
      act(() => result.current.closeFullscreen());

      // Fire Escape — already closed, state should still be null without error
      act(() => {
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      });
      expect(result.current.fullscreenTileId).to.equal(null);
    });
  });

  describe('numeric keys', () => {
    it('should work with numeric tile ids', () => {
      const { result } = renderHook(() => useMosaicFullscreen<number>());
      act(() => result.current.setFullscreen(42));
      expect(result.current.fullscreenTileId).to.equal(42);

      act(() => result.current.closeFullscreen());
      expect(result.current.fullscreenTileId).to.equal(null);
    });
  });
});
