'use client';

import type { Note } from '@/types/note';
import { formatDate } from '@/utils/date';

interface ReaderNotesProps {
  notes: Note[];
  currentPage: number;
  onJump: (page: number) => void;
  onEdit: (note: Note) => void;
  onDelete: (id: string) => void;
  onCreate: () => void;
  showTitle?: boolean;
}

function preview(text: string): string {
  const t = text.replace(/\s+/g, ' ').trim();
  return t.length > 100 ? `${t.slice(0, 99)}…` : t;
}

export function ReaderNotes({
  notes,
  currentPage,
  onJump,
  onEdit,
  onDelete,
  onCreate,
  showTitle = false,
}: ReaderNotesProps) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        {showTitle ? <h2 className="text-sm font-semibold text-foreground">Notes</h2> : <span />}
        <button
          type="button"
          onClick={onCreate}
          className="text-xs font-medium text-tint hover:underline"
        >
          New note
        </button>
      </div>
      <ul className="flex-1 overflow-y-auto p-2">
        {notes.length === 0 ? (
          <li className="px-2 py-6 text-center text-xs text-muted">No notes yet</li>
        ) : (
          notes.map((note) => (
            <li key={note.id}>
              <div
                className={`group rounded-md px-2 py-2 ${
                  note.pageNumber === currentPage ? 'bg-tint-muted' : 'hover:bg-background'
                }`}
              >
                <button type="button" className="w-full text-left" onClick={() => onJump(note.pageNumber)}>
                  <p className="text-sm text-foreground">{preview(note.noteText)}</p>
                  <p className="mt-1 text-xs text-muted">
                    p. {note.pageNumber} · {formatDate(note.updatedAt)}
                  </p>
                </button>
                <div className="mt-1 flex gap-2 opacity-0 group-hover:opacity-100 focus-within:opacity-100">
                  <button
                    type="button"
                    className="text-xs font-medium text-tint"
                    onClick={() => onEdit(note)}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="text-xs font-medium text-red-600"
                    onClick={() => onDelete(note.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </li>
          ))
        )}
      </ul>
      <p className="border-t border-border px-3 py-2 text-[11px] text-muted">
        Dictionary · TTS · shared notes — later
      </p>
    </div>
  );
}
