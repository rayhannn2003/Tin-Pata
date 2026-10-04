'use client';

import Link from 'next/link';

import { FullscreenButton } from '@/components/reader/FullscreenButton';
import { ZoomControls } from '@/components/reader/ZoomControls';
import type { ReaderZoomMode } from '@/types/reader';
import { ROUTES } from '@/utils/constants';
import { progressPercent } from '@/types/book';

interface ReaderToolbarProps {
  title: string;
  bookId: string;
  currentPage: number;
  totalPages: number;
  zoomMode: ReaderZoomMode;
  displayScale: number;
  bookmarked: boolean;
  fullscreen: boolean;
  leftOpen: boolean;
  rightOpen: boolean;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitWidth: () => void;
  onFitPage: () => void;
  onToggleFullscreen: () => void;
  onToggleBookmark: () => void;
  onOpenGoToPage: () => void;
  onOpenSettings: () => void;
  onOpenDictionary: () => void;
  onOpenSummary: () => void;
  onNewNote: () => void;
  onToggleCheckpointMode: () => void;
  checkpointDrawMode: boolean;
  onToggleLeft: () => void;
  onToggleRight: () => void;
  onToggleFocusMode: () => void;
}

export function ReaderToolbar({
  title,
  bookId,
  currentPage,
  totalPages,
  zoomMode,
  displayScale,
  bookmarked,
  fullscreen,
  leftOpen,
  rightOpen,
  onZoomIn,
  onZoomOut,
  onFitWidth,
  onFitPage,
  onToggleFullscreen,
  onToggleBookmark,
  onOpenGoToPage,
  onOpenSettings,
  onOpenDictionary,
  onOpenSummary,
  onNewNote,
  onToggleCheckpointMode,
  checkpointDrawMode,
  onToggleLeft,
  onToggleRight,
  onToggleFocusMode,
}: ReaderToolbarProps) {
  const percent = progressPercent(currentPage, totalPages);
  const focusMode = !leftOpen && !rightOpen;

  return (
    <header className="flex shrink-0 flex-wrap items-center gap-2 border-b border-border bg-surface px-3 py-2 md:gap-3 md:px-4">
      <Link
        href={ROUTES.book(bookId)}
        className="rounded-md px-2 py-1.5 text-sm font-medium text-tint hover:bg-tint-muted"
        aria-label="Back to book details"
      >
        ← Back
      </Link>

      <div className="min-w-0 flex-1">
        <h1 className="truncate text-sm font-semibold text-foreground md:text-base">{title}</h1>
        <p className="text-xs text-muted">
          <button
            type="button"
            onClick={onOpenGoToPage}
            className="rounded underline-offset-2 hover:underline"
            aria-label="Go to page"
          >
            Page {currentPage}
            {totalPages > 0 ? ` / ${totalPages}` : ''}
          </button>
          <span className="mx-1.5" aria-hidden>
            ·
          </span>
          {percent}%
        </p>
      </div>

      <div className="hidden sm:block">
        <ZoomControls
          zoomMode={zoomMode}
          displayScale={displayScale}
          onZoomIn={onZoomIn}
          onZoomOut={onZoomOut}
          onFitWidth={onFitWidth}
          onFitPage={onFitPage}
        />
      </div>

      <button
        type="button"
        disabled
        title="PDF text search comes in a later phase"
        className="hidden h-8 rounded-md px-2 text-xs text-muted opacity-60 md:inline-flex"
        aria-label="Search (coming soon)"
      >
        Search
      </button>

      <button
        type="button"
        aria-pressed={bookmarked}
        aria-label={bookmarked ? 'Remove bookmark for this page' : 'Bookmark this page'}
        title="Bookmark (B)"
        onClick={onToggleBookmark}
        className={`inline-flex h-8 items-center rounded-md px-2 text-xs font-medium ${
          bookmarked ? 'bg-tint text-white' : 'text-foreground hover:bg-tint-muted'
        }`}
      >
        {bookmarked ? 'Bookmarked' : 'Bookmark'}
      </button>

      <button
        type="button"
        onClick={onNewNote}
        title="New note (N)"
        className="hidden h-8 items-center rounded-md px-2 text-xs font-medium text-foreground hover:bg-tint-muted sm:inline-flex"
      >
        Note
      </button>

      <button
        type="button"
        onClick={onOpenDictionary}
        title="Dictionary (D)"
        className="inline-flex h-8 items-center rounded-md px-2 text-xs font-medium text-foreground hover:bg-tint-muted"
        aria-label="Open dictionary"
      >
        Dictionary
      </button>

      <button
        type="button"
        onClick={onOpenSummary}
        title="AI Summary (S)"
        className="inline-flex h-8 items-center rounded-md px-2 text-xs font-medium text-foreground hover:bg-tint-muted"
        aria-label="Open AI summary"
      >
        AI Summary
      </button>

      <button
        type="button"
        aria-pressed={checkpointDrawMode}
        onClick={onToggleCheckpointMode}
        title="Draw a reading checkpoint line (C)"
        className={`inline-flex h-8 items-center rounded-md px-2 text-xs font-medium ${
          checkpointDrawMode ? 'bg-tint text-white' : 'text-foreground hover:bg-tint-muted'
        }`}
        aria-label="Toggle checkpoint drawing"
      >
        Checkpoint
      </button>

      <button
        type="button"
        onClick={onOpenSettings}
        className="inline-flex h-8 items-center rounded-md px-2 text-xs font-medium text-foreground hover:bg-tint-muted"
        aria-label="Reader settings"
      >
        Settings
      </button>

      <FullscreenButton active={fullscreen} onToggle={onToggleFullscreen} />

      <div className="hidden items-center gap-1 lg:flex" role="group" aria-label="Panels">
        <button
          type="button"
          aria-pressed={focusMode}
          title={focusMode ? 'Show bookmarks & notes (H)' : 'Hide sidebars for focus reading (H)'}
          onClick={onToggleFocusMode}
          className={`h-8 rounded-md px-2 text-xs font-medium ${
            focusMode ? 'bg-tint text-white' : 'text-foreground hover:bg-tint-muted'
          }`}
        >
          {focusMode ? 'Show panels' : 'Focus'}
        </button>
        <button
          type="button"
          aria-pressed={leftOpen}
          title={leftOpen ? 'Hide bookmarks' : 'Show bookmarks'}
          onClick={onToggleLeft}
          className={`h-8 rounded-md px-2 text-xs ${leftOpen ? 'bg-tint-muted text-tint' : 'text-muted hover:bg-tint-muted'}`}
        >
          Bookmarks
        </button>
        <button
          type="button"
          aria-pressed={rightOpen}
          title={rightOpen ? 'Hide notes' : 'Show notes'}
          onClick={onToggleRight}
          className={`h-8 rounded-md px-2 text-xs ${rightOpen ? 'bg-tint-muted text-tint' : 'text-muted hover:bg-tint-muted'}`}
        >
          Notes
        </button>
      </div>
    </header>
  );
}
