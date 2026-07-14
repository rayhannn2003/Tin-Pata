'use client';

import { useEffect, useId, useState } from 'react';

interface GoToPageDialogProps {
  open: boolean;
  currentPage: number;
  totalPages: number;
  onClose: () => void;
  onGo: (page: number) => void;
}

export function GoToPageDialog({
  open,
  currentPage,
  totalPages,
  onClose,
  onGo,
}: GoToPageDialogProps) {
  if (!open) {
    return null;
  }

  return (
    <GoToPageDialogInner
      key={`${open}-${currentPage}`}
      currentPage={currentPage}
      totalPages={totalPages}
      onClose={onClose}
      onGo={onGo}
    />
  );
}

function GoToPageDialogInner({
  currentPage,
  totalPages,
  onClose,
  onGo,
}: Omit<GoToPageDialogProps, 'open'>) {
  const titleId = useId();
  const [value, setValue] = useState(String(currentPage));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
      }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const page = Number.parseInt(value, 10);
    if (!Number.isFinite(page) || page < 1 || page > totalPages) {
      setError(`Enter a page between 1 and ${totalPages}.`);
      return;
    }
    onGo(page);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" role="presentation">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label="Close go to page"
        onClick={onClose}
      />
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onSubmit={submit}
        className="relative z-10 w-full max-w-sm rounded-xl border border-border bg-surface p-5 shadow-lg"
      >
        <h2 id={titleId} className="text-base font-semibold text-foreground">
          Go to page
        </h2>
        <label htmlFor="goto-page" className="mt-3 block text-xs font-medium text-muted">
          Page number (1–{totalPages})
        </label>
        <input
          id="goto-page"
          type="number"
          min={1}
          max={totalPages}
          value={value}
          autoFocus
          onChange={(e) => setValue(e.target.value)}
          className="mt-1.5 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
        />
        {error ? <p className="mt-2 text-xs text-red-600">{error}</p> : null}
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
            Go
          </button>
        </div>
      </form>
    </div>
  );
}
