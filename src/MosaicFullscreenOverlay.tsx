import React from 'react';

export interface MosaicFullscreenOverlayProps {
  title: React.ReactNode;
  children: React.ReactNode;
  onClose: () => void;
  /** Accessible label for the close button. Default: "Close". */
  closeLabel?: string;
}

/**
 * A dependency-free fullscreen overlay for a single mosaic tile.
 * Clicking the backdrop or the close button dismisses it; Escape handling
 * is provided by {@link useMosaicFullscreen}.
 */
export const MosaicFullscreenOverlay: React.FC<MosaicFullscreenOverlayProps> = ({
  title,
  children,
  onClose,
  closeLabel,
}) => (
  <div className="mosaic-fs-overlay" onMouseDown={onClose}>
    <div className="mosaic-fs-dialog" onMouseDown={(e) => e.stopPropagation()}>
      <div className="mosaic-fs-header">
        <div className="mosaic-fs-title">{title}</div>
        <button type="button" className="mosaic-fs-close" aria-label={closeLabel || 'Close'} onClick={onClose}>
          <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true" focusable="false">
            <path
              d="M1 1l12 12M13 1L1 13"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              fill="none"
            />
          </svg>
        </button>
      </div>
      <div className="mosaic-fs-body">{children}</div>
    </div>
  </div>
);
