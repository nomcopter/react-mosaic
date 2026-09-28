// Browsers draw nothing for a hidden drag image, so a hidden drag preview is
// shown just long enough for the dragstart snapshot. Call it while dragstart
// is dispatched (an onDragStart handler or a drag source's item()): the
// snapshot is taken after that.
const DRAG_IMAGE_CLASS = '-drag-image';

export function revealForDragImage(node: HTMLElement | null): void {
  if (node == null) {
    return;
  }
  node.classList.add(DRAG_IMAGE_CLASS);
  setTimeout(() => node.classList.remove(DRAG_IMAGE_CLASS), 0);
}
