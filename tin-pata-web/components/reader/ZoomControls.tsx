'use client';

import type { ReactNode } from 'react';

import type { ReaderZoomMode } from '@/types/reader';

interface ZoomControlsProps {
  zoomMode: ReaderZoomMode;
  displayScale: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitWidth: () => void;
  onFitPage: () => void;
}

export function ZoomControls({
  zoomMode,
  displayScale,
  onZoomIn,
  onZoomOut,
  onFitWidth,
  onFitPage,
}: ZoomControlsProps) {
  const percent = Math.round(displayScale * 100);

  return (
    <div className="flex items-center gap-1" role="group" aria-label="Zoom">
      <IconButton label="Zoom out" onClick={onZoomOut}>
        −
      </IconButton>
      <span className="min-w-[3.25rem] text-center text-xs tabular-nums text-muted" aria-live="polite">
        {percent}%
      </span>
      <IconButton label="Zoom in" onClick={onZoomIn}>
        +
      </IconButton>
      <IconButton
        label="Fit width"
        onClick={onFitWidth}
        pressed={zoomMode === 'fit-width'}
      >
        W
      </IconButton>
      <IconButton label="Fit page" onClick={onFitPage} pressed={zoomMode === 'fit-page'}>
        P
      </IconButton>
    </div>
  );
}

function IconButton({
  label,
  onClick,
  children,
  pressed,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
  pressed?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={pressed}
      title={label}
      onClick={onClick}
      className={`inline-flex h-8 min-w-8 items-center justify-center rounded-md px-2 text-sm font-medium ${
        pressed
          ? 'bg-tint text-white'
          : 'text-foreground hover:bg-tint-muted'
      }`}
    >
      {children}
    </button>
  );
}
