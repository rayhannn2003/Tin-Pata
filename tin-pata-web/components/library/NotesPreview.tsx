import type { Note } from '@/types/note';
import { formatDate } from '@/utils/date';

interface NotesPreviewProps {
  notes: Note[];
  totalCount: number;
}

function previewText(text: string, max = 120): string {
  const compact = text.replace(/\s+/g, ' ').trim();
  if (compact.length <= max) {
    return compact;
  }
  return `${compact.slice(0, max - 1)}…`;
}

export function NotesPreview({ notes, totalCount }: NotesPreviewProps) {
  return (
    <section className="rounded-xl border border-border bg-surface p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-foreground">Notes</h2>
          <p className="mt-1 text-sm text-muted">
            {totalCount} total · latest preview
          </p>
        </div>
        <button
          type="button"
          disabled
          title="Full notes list comes later"
          className="text-xs font-medium text-tint opacity-60"
        >
          View all
        </button>
      </div>

      {notes.length === 0 ? (
        <p className="mt-6 text-sm text-muted">No notes yet.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {notes.map((note) => (
            <li key={note.id} className="rounded-lg bg-background/80 px-3 py-2.5">
              <p className="text-sm text-foreground">{previewText(note.noteText)}</p>
              <p className="mt-1 text-xs text-muted">
                Page {note.pageNumber} · Updated {formatDate(note.updatedAt)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
