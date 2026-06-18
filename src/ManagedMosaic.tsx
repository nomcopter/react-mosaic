import classNames from 'classnames';
import React, { useContext, useEffect, useRef, useState } from 'react';

import { MosaicConfigurationHelper } from './configuration/mosaicConfigurationHelper';
import { DEFAULT_MOSAIC_LABELS, MosaicConfiguration, MosaicLabels, MosaicPanelStyle, MosaicSchema } from './configuration/types';
import { MosaicContext } from './contextTypes';
import { Mosaic } from './Mosaic';
import { MosaicFullscreenOverlay } from './MosaicFullscreenOverlay';
import { MosaicWindow } from './MosaicWindow';
import { MosaicBranch } from './types';
import { MosaicTree } from './util/mosaicTree';
import { useMosaicFullscreen } from './useMosaicFullscreen';

const AUTO_CLOSE_TOOLBAR_MS = 3000;

function variantClassName(style: MosaicPanelStyle | undefined): string | undefined {
  if (!style) {
    return undefined;
  }
  const classes = [
    style.transparentBackground && 'transparent-bg',
    style.noBackground && 'no-bg',
    style.glassBackground && 'glass-bg',
    style.hideToolbar && 'hide-toolbar',
    style.noBorder && 'no-border',
  ].filter(Boolean);
  return classes.length ? classes.join(' ') : undefined;
}

/* ─── icons ──────────────────────────────────────────────────────────────── */

const iconPathProps = {
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  fill: 'none',
};

const ExpandIcon: React.FC = () => (
  <svg width="13" height="13" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
    <path d="M9.5 2.5H13.5V6.5M13.5 2.5L9 7M6.5 13.5H2.5V9.5M2.5 13.5L7 9" {...iconPathProps} />
  </svg>
);

const FullscreenIcon: React.FC = () => (
  <svg width="13" height="13" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
    <path d="M2.5 6V2.5H6M14 6V2.5h-3.5M2.5 10v3.5H6M14 10v3.5h-3.5" {...iconPathProps} />
  </svg>
);

const RemoveIcon: React.FC = () => (
  <svg width="13" height="13" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
    <path d="M3.5 3.5l9 9M12.5 3.5l-9 9" {...iconPathProps} />
  </svg>
);

interface ToolbarButtonProps {
  tooltip: string;
  onClick: () => void;
  children: React.ReactNode;
}

const ToolbarButton: React.FC<ToolbarButtonProps> = ({ tooltip, onClick, children }) => (
  <button type="button" className="mosaic-toolbar-btn" title={tooltip} onClick={onClick}>
    {children}
  </button>
);

/* ─── toolbar ────────────────────────────────────────────────────────────── */

interface ManagedToolbarProps {
  path: MosaicBranch[];
  labels: MosaicLabels;
  isLastActive: boolean;
  isLocked: boolean;
  toolbarActions?: React.ReactNode;
  onFullscreen: () => void;
  onRemovePanel: () => void;
}

const ManagedToolbar: React.FC<ManagedToolbarProps> = ({
  path,
  labels,
  isLastActive,
  isLocked,
  toolbarActions,
  onFullscreen,
  onRemovePanel,
}) => {
  const { mosaicActions } = useContext(MosaicContext);

  const handleExpand = () => mosaicActions.expand(path);
  const handleRemove = () => {
    onRemovePanel();
    mosaicActions.remove(path);
  };

  return (
    <div className="mosaic-managed-controls">
      {toolbarActions}
      <ToolbarButton tooltip={labels.expandTooltip} onClick={handleExpand}>
        <ExpandIcon />
      </ToolbarButton>
      <ToolbarButton tooltip={labels.fullscreenTooltip} onClick={onFullscreen}>
        <FullscreenIcon />
      </ToolbarButton>
      {!isLastActive && !isLocked && (
        <ToolbarButton tooltip={labels.removePanelTooltip} onClick={handleRemove}>
          <RemoveIcon />
        </ToolbarButton>
      )}
    </div>
  );
};

/* ─── tile ───────────────────────────────────────────────────────────────── */

interface ManagedTileProps {
  id: string;
  path: MosaicBranch[];
  configuration: MosaicConfiguration;
  currentViewKey: string;
  labels: MosaicLabels;
  isLastActive: boolean;
  fullscreenTileId: string | null;
  onSetFullscreen: (id: string) => void;
  onCloseFullscreen: () => void;
  onRemovePanel: () => void;
}

const ManagedTile: React.FC<ManagedTileProps> = ({
  id,
  path,
  configuration,
  currentViewKey,
  labels,
  isLastActive,
  fullscreenTileId,
  onSetFullscreen,
  onCloseFullscreen,
  onRemovePanel,
}) => {
  const [toolbarOpen, setToolbarOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const definition = configuration.components[id];
  const hideToolbar = configuration.style && configuration.style.hideToolbar;
  const isFullscreen = id === fullscreenTileId;

  const cancelClose = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  };

  const scheduleClose = () => {
    cancelClose();
    closeTimerRef.current = setTimeout(() => setToolbarOpen(false), AUTO_CLOSE_TOOLBAR_MS);
  };

  useEffect(() => {
    if (!toolbarOpen) {
      cancelClose();
      return;
    }

    scheduleClose();

    const onClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setToolbarOpen(false);
      }
    };
    document.addEventListener('mousedown', onClickOutside);

    return () => {
      cancelClose();
      document.removeEventListener('mousedown', onClickOutside);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toolbarOpen]);

  const isLocked = MosaicConfigurationHelper.isComponentLocked(id, currentViewKey, configuration);

  return (
    <div
      ref={wrapperRef}
      className={classNames('mosaic-tile-fs-wrapper', { 'toolbar-open': hideToolbar && toolbarOpen })}
      onMouseEnter={toolbarOpen ? cancelClose : undefined}
      onMouseLeave={toolbarOpen ? scheduleClose : undefined}
    >
      {isFullscreen && definition && (
        <MosaicFullscreenOverlay title={definition.title} onClose={onCloseFullscreen} closeLabel={labels.fullscreenClose}>
          {definition.component}
        </MosaicFullscreenOverlay>
      )}

      <MosaicWindow<string>
        path={path}
        createNode={() => 'new'}
        title=""
        renderToolbar={() => (
          <div className="mosaic-managed-toolbar">
            <div className="mosaic-window-title">{definition ? definition.title : labels.undefinedComponentTitle}</div>
            <div className="mosaic-window-controls">
              <ManagedToolbar
                path={path}
                labels={labels}
                isLastActive={isLastActive}
                isLocked={isLocked}
                toolbarActions={definition ? definition.toolbarActions : undefined}
                onFullscreen={() => onSetFullscreen(id)}
                onRemovePanel={onRemovePanel}
              />
            </div>
          </div>
        )}
      >
        {isFullscreen ? null : definition ? definition.component : (
          <div className="mosaic-undefined-component">{labels.undefinedComponentContent(id)}</div>
        )}
      </MosaicWindow>

      {hideToolbar && (
        <button
          type="button"
          className={classNames('mosaic-toolbar-indicator', { 'is-open': toolbarOpen })}
          onClick={() => setToolbarOpen((v) => !v)}
          aria-label={toolbarOpen ? labels.toolbarClose : labels.toolbarOpen}
        />
      )}
    </div>
  );
};

/* ─── managed mosaic ─────────────────────────────────────────────────────── */

export interface ManagedMosaicProps {
  /** The components, views and visual style for this mosaic instance. */
  configuration: MosaicConfiguration;
  /** Current (settled) schema, typically the persisted layout. */
  value: MosaicSchema;
  /** Key of the currently active view (used to resolve locked components). */
  currentViewKey: string;
  /**
   * Called when a layout change settles (drag/resize/remove completes).
   * `useDebounce` is `false` when the change was a panel removal so callers
   * can persist immediately instead of waiting out a debounce.
   */
  onChange: (schema: MosaicSchema, useDebounce?: boolean) => void;
  /** Text overrides for localization. */
  labels?: Partial<MosaicLabels>;
}

/**
 * A batteries-included mosaic that renders registered components by key and
 * provides tile fullscreen, an auto-hiding toolbar, locked panels and visual
 * style variants. Persistence is delegated to the `onChange` callback.
 */
export const ManagedMosaic: React.FC<ManagedMosaicProps> = ({
  configuration,
  value,
  currentViewKey,
  onChange,
  labels,
}) => {
  const fullscreen = useMosaicFullscreen<string>();
  const [liveValue, setLiveValue] = useState<MosaicSchema>(value);
  const isRemovingRef = useRef(false);

  useEffect(() => setLiveValue(value), [value]);

  const mergedLabels: MosaicLabels = labels ? { ...DEFAULT_MOSAIC_LABELS, ...labels } : DEFAULT_MOSAIC_LABELS;

  const handleChange = (next: MosaicSchema) => setLiveValue(next);

  const handleRelease = (next: MosaicSchema) => {
    onChange(next, !isRemovingRef.current);
    if (isRemovingRef.current) {
      isRemovingRef.current = false;
    }
  };

  const handleRemovePanel = () => {
    isRemovingRef.current = true;
  };

  const isLastActive = MosaicTree.isSingleLeaf(liveValue);
  const className = variantClassName(configuration.style);

  return (
    <Mosaic<string>
      value={liveValue}
      onChange={handleChange}
      onRelease={handleRelease}
      className={className}
      renderTile={(id, path) => (
        <ManagedTile
          id={id}
          path={path}
          configuration={configuration}
          currentViewKey={currentViewKey}
          labels={mergedLabels}
          isLastActive={isLastActive}
          fullscreenTileId={fullscreen.fullscreenTileId}
          onSetFullscreen={fullscreen.setFullscreen}
          onCloseFullscreen={fullscreen.closeFullscreen}
          onRemovePanel={handleRemovePanel}
        />
      )}
    />
  );
};
