'use client';

import { useState, type ReactNode } from 'react';

import { ReaderBookmarks } from '@/components/reader/ReaderBookmarks';
import { ReaderCheckpoints } from '@/components/reader/ReaderCheckpoints';
import { ReaderNotes } from '@/components/reader/ReaderNotes';
import type { Bookmark } from '@/types/bookmark';
import type { ReaderCheckpoint } from '@/types/checkpoint';
import type { Note } from '@/types/note';

interface ReaderSidebarProps {
  side: 'left' | 'right';
  open: boolean;
  width: number;
  bookmarks: Bookmark[];
  notes: Note[];
  checkpoints?: ReaderCheckpoint[];
  checkpointDrawMode?: boolean;
  currentPage: number;
  onJump: (page: number) => void;
  onDeleteBookmark: (id: string) => void;
  onCreateBookmark: () => void;
  onCreateNote: () => void;
  onEditNote: (note: Note) => void;
  onDeleteNote: (id: string) => void;
  onDeleteCheckpoint?: (id: string) => void;
  onStartCheckpointDraw?: () => void;
  onCollapse: () => void;
  onExpand: () => void;
  onResizeStart?: (event: React.PointerEvent) => void;
}

export function ReaderSidebar({
  side,
  open,
  width,
  bookmarks,
  notes,
  checkpoints = [],
  checkpointDrawMode = false,
  currentPage,
  onJump,
  onDeleteBookmark,
  onCreateBookmark,
  onCreateNote,
  onEditNote,
  onDeleteNote,
  onDeleteCheckpoint,
  onStartCheckpointDraw,
  onCollapse,
  onExpand,
  onResizeStart,
}: ReaderSidebarProps) {
  const [leftTab, setLeftTab] = useState<'bookmarks' | 'checkpoints'>('bookmarks');
  const label =
    side === 'left'
      ? leftTab === 'checkpoints'
        ? 'Checkpoints'
        : 'Bookmarks'
      : 'Notes';

  if (!open) {
    return (
      <div
        className={`relative z-10 hidden h-full shrink-0 lg:flex ${
          side === 'left' ? 'border-r border-border' : 'border-l border-border'
        }`}
      >
        <button
          type="button"
          onClick={onExpand}
          title={`Show ${label.toLowerCase()}`}
          aria-label={`Expand ${label.toLowerCase()} panel`}
          className="flex h-full w-9 flex-col items-center justify-center gap-2 bg-surface text-muted transition hover:bg-tint-muted hover:text-tint"
        >
          <span className="text-base leading-none" aria-hidden>
            {side === 'left' ? '›' : '‹'}
          </span>
          <span
            className="text-[10px] font-medium tracking-wide"
            style={{ writingMode: 'vertical-rl', transform: side === 'left' ? 'rotate(180deg)' : undefined }}
          >
            {label}
          </span>
        </button>
      </div>
    );
  }

  const content: ReactNode =
    side === 'left' ? (
      leftTab === 'checkpoints' ? (
        <ReaderCheckpoints
          checkpoints={checkpoints}
          currentPage={currentPage}
          onJump={onJump}
          onDelete={(id) => onDeleteCheckpoint?.(id)}
          onStartDraw={() => onStartCheckpointDraw?.()}
          drawMode={checkpointDrawMode}
        />
      ) : (
        <ReaderBookmarks
          bookmarks={bookmarks}
          currentPage={currentPage}
          onJump={onJump}
          onDelete={onDeleteBookmark}
          onCreate={onCreateBookmark}
        />
      )
    ) : (
      <ReaderNotes
        notes={notes}
        currentPage={currentPage}
        onJump={onJump}
        onEdit={onEditNote}
        onDelete={onDeleteNote}
        onCreate={onCreateNote}
      />
    );

  return (
    <aside
      className={`relative hidden h-full shrink-0 border-border bg-surface lg:flex lg:flex-col ${
        side === 'left' ? 'border-r' : 'border-l'
      }`}
      style={{ width }}
      aria-label={`${label} sidebar`}
    >
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-border px-2 py-1.5">
        {side === 'left' ? (
          <div className="flex min-w-0 flex-1 gap-1">
            <button
              type="button"
              aria-pressed={leftTab === 'bookmarks'}
              onClick={() => setLeftTab('bookmarks')}
              className={`rounded-md px-2 py-1 text-xs font-semibold ${
                leftTab === 'bookmarks' ? 'bg-tint-muted text-tint' : 'text-muted hover:text-foreground'
              }`}
            >
              Bookmarks
            </button>
            <button
              type="button"
              aria-pressed={leftTab === 'checkpoints'}
              onClick={() => setLeftTab('checkpoints')}
              className={`rounded-md px-2 py-1 text-xs font-semibold ${
                leftTab === 'checkpoints' ? 'bg-tint-muted text-tint' : 'text-muted hover:text-foreground'
              }`}
            >
              Checkpoints
            </button>
          </div>
        ) : (
          <p className="px-1 text-xs font-semibold text-foreground">{label}</p>
        )}
        <button
          type="button"
          onClick={onCollapse}
          title={`Hide ${label.toLowerCase()}`}
          aria-label={`Collapse ${label.toLowerCase()} panel`}
          className="inline-flex h-7 items-center rounded-md px-2 text-xs font-medium text-muted hover:bg-tint-muted hover:text-foreground"
        >
          {side === 'left' ? '‹ Hide' : 'Hide ›'}
        </button>
      </div>
      <div className="min-h-0 flex-1">{content}</div>
      <div
        role="separator"
        aria-orientation="vertical"
        aria-label={`Resize ${side} sidebar`}
        onPointerDown={onResizeStart}
        className={`absolute top-0 z-10 hidden h-full w-1 cursor-col-resize bg-transparent hover:bg-tint/40 lg:block ${
          side === 'left' ? 'right-0' : 'left-0'
        }`}
      />
    </aside>
  );
}
