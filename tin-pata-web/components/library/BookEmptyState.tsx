export function BookEmptyState({ onUpload }: { onUpload?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-surface px-6 py-16 text-center shadow-sm">
      <div
        className="mb-6 flex h-24 w-20 items-center justify-center rounded-lg bg-gradient-to-br from-tint-muted to-border/50"
        aria-hidden
      >
        <span className="text-3xl font-semibold text-tint">TP</span>
      </div>
      <h2 className="text-lg font-semibold text-foreground">Your library is empty</h2>
      <p className="mt-2 max-w-md text-sm text-muted">
        Upload a PDF from the web (max 20 MB) or sync books from the Tin Pata mobile app.
      </p>
      {onUpload ? (
        <button
          type="button"
          onClick={onUpload}
          className="mt-6 inline-flex items-center justify-center rounded-md bg-tint px-5 py-2.5 text-sm font-medium text-white hover:opacity-90"
        >
          Upload PDF
        </button>
      ) : null}
      <ul className="mt-6 space-y-2 text-left text-sm text-muted">
        <li className="flex gap-2">
          <span className="text-tint" aria-hidden>
            •
          </span>
          Upload PDFs directly to cloud storage
        </li>
        <li className="flex gap-2">
          <span className="text-tint" aria-hidden>
            •
          </span>
          Or import and sync from mobile
        </li>
        <li className="flex gap-2">
          <span className="text-tint" aria-hidden>
            •
          </span>
          Open details or continue reading anytime
        </li>
      </ul>
    </div>
  );
}
