'use client';

import type { PdfSelectedPassage } from '@/utils/pdfTextSelection';

interface ExplainSelectionActionProps {
  rect: PdfSelectedPassage['rect'];
  onExplain: () => void;
}

const BUTTON_WIDTH = 104;
const BUTTON_HEIGHT = 32;
const GAP = 8;
const EDGE = 8;

/**
 * Contextual "Explain" chip anchored to the current PDF selection.
 *
 * Positioned `fixed` against the viewport rather than the page, so it never affects
 * text-layer layout. The container dismisses it on scroll, resize, and Escape.
 */
export function ExplainSelectionAction({ rect, onExplain }: ExplainSelectionActionProps) {
  const viewportWidth = typeof window === 'undefined' ? 1024 : window.innerWidth;
  const viewportHeight = typeof window === 'undefined' ? 768 : window.innerHeight;

  const belowTop = rect.bottom + GAP;
  const fitsBelow = belowTop + BUTTON_HEIGHT + EDGE <= viewportHeight;
  const top = fitsBelow
    ? belowTop
    : Math.max(EDGE, rect.top - GAP - BUTTON_HEIGHT);

  const half = BUTTON_WIDTH / 2;
  const left = Math.min(
    Math.max((rect.left + rect.right) / 2, EDGE + half),
    Math.max(EDGE + half, viewportWidth - EDGE - half),
  );

  return (
    <button
      type="button"
      // Keep the selection alive: mousedown would otherwise collapse it before click.
      onMouseDown={(event) => event.preventDefault()}
      onClick={onExplain}
      style={{ top, left, width: BUTTON_WIDTH, height: BUTTON_HEIGHT }}
      className="fixed z-[55] -translate-x-1/2 rounded-full border border-border bg-surface text-xs font-medium text-tint shadow-md transition hover:bg-tint-muted"
    >
      <span aria-hidden>✨</span> Explain
    </button>
  );
}
