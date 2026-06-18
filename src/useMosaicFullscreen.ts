import { useCallback, useEffect, useState } from 'react';

import { MosaicKey } from './types';

export interface MosaicFullscreenApi<T extends MosaicKey> {
  fullscreenTileId: T | null;
  setFullscreen: (id: T) => void;
  closeFullscreen: () => void;
}

/**
 * Tracks which tile is currently shown fullscreen and closes it on Escape.
 */
export function useMosaicFullscreen<T extends MosaicKey = string>(): MosaicFullscreenApi<T> {
  const [fullscreenTileId, setFullscreenTileId] = useState<T | null>(null);

  const setFullscreen = useCallback((id: T) => setFullscreenTileId(id), []);
  const closeFullscreen = useCallback(() => setFullscreenTileId(null), []);

  useEffect(() => {
    if (fullscreenTileId == null) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeFullscreen();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [fullscreenTileId, closeFullscreen]);

  return { fullscreenTileId, setFullscreen, closeFullscreen };
}
