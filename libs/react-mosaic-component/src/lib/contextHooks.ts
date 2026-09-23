import { useContext } from 'react';

import { MosaicContext, MosaicWindowContext } from './contextTypes';
import { MosaicKey } from './types';

/**
 * Returns the context of the enclosing `Mosaic` (`mosaicActions`, `mosaicId`,
 * `blueprintNamespace`), typed with your panel key type.
 *
 * @throws if called outside of a `Mosaic`
 */
export function useMosaic<T extends MosaicKey = string>(): MosaicContext<T> {
  const context = useContext(MosaicContext);
  if (context == null) {
    throw new Error('useMosaic must be used inside a <Mosaic>');
  }
  return context as unknown as MosaicContext<T>;
}

/**
 * Returns the context of the enclosing `MosaicWindow` (`mosaicWindowActions`,
 * `blueprintNamespace`).
 *
 * @throws if called outside of a `MosaicWindow`
 */
export function useMosaicWindow(): MosaicWindowContext {
  const context = useContext(MosaicWindowContext);
  if (context == null) {
    throw new Error('useMosaicWindow must be used inside a <MosaicWindow>');
  }
  return context;
}
