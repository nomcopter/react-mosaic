import { ReactNode } from 'react';

// What the touch drag preview shows for a drag item. Kept outside the item so
// the public MosaicDragItem shape doesn't change; the entry goes away with the
// item object.
const previews = new WeakMap<object, () => ReactNode>();

export function registerDragPreview(
  item: object,
  render: () => ReactNode,
): void {
  previews.set(item, render);
}

export function getDragPreview(item: unknown): (() => ReactNode) | undefined {
  return typeof item === 'object' && item !== null
    ? previews.get(item)
    : undefined;
}
