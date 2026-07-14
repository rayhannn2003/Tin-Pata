'use client';

import { useEffect, useId, useState } from 'react';

import type { Note } from '@/types/note';

interface NoteEditorDialogProps {
  open: boolean;
  pageNumber: number;
  note?: Note | null;
  /** Prefill for a new note (e.g. dictionary definition). Ignored when editing. */
  initialText?: string;
  onClose: () => void;
  onSave: (text: string) => void;
}

export function NoteEditorDialog({
  open,
  pageNumber,
  note,
  initialText = '',
  onClose,
  onSave,
}: NoteEditorDialogProps) {
  if (!open) return null;

  return (
    <NoteEditorDialogInner
      key={note?.id ?? `new-${pageNumber}-${initialText.slice(0, 24)}`}
      pageNumber={pageNumber}
      note={note}
      initialText={initialText}
      onClose={onClose}
      onSave={onSave}
    />
  );
}

function NoteEditorDialogInner({
  pageNumber,
  note,
  initialText = '',
  onClose,
  onSave,
}: Omit<NoteEditorDialogProps, 'open'>) {
  const titleId = useId();
  const [text, setText] = useState(note?.noteText ?? initialText);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label="Close note editor"
        onClick={onClose}
      />
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 w-full max-w-md rounded-xl border border-border bg-surface p-5 shadow-lg"
        onSubmit={(e) => {
          e.preventDefault();
          onSave(text);
        }}
      >
        <h2 id={titleId} className="text-base font-semibold text-foreground">
          {note ? 'Edit note' : 'New note'}
        </h2>
        <p className="mt-1 text-xs text-muted">Page {pageNumber}</p>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={8}
          autoFocus
          className="mt-3 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          placeholder="Write your note…"
        />
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-3 py-2 text-sm text-muted hover:bg-tint-muted"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="rounded-md bg-tint px-3 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            Save
          </button>
        </div>
      </form>
    </div>
  );
}
