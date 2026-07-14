'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  BookUploadService,
  formatMaxWebPdfSize,
  MAX_WEB_PDF_BYTES,
  type BookUploadProgress,
} from '@/services/BookUploadService';
import { formatFileSize } from '@/types/book';
import { ROUTES } from '@/utils/constants';

interface UploadBookDialogProps {
  open: boolean;
  onClose: () => void;
  onUploaded?: (bookId: string) => void;
}

export function UploadBookDialog({ open, onClose, onUploaded }: UploadBookDialogProps) {
  if (!open) {
    return null;
  }

  return <UploadBookDialogInner onClose={onClose} onUploaded={onUploaded} />;
}

function UploadBookDialogInner({
  onClose,
  onUploaded,
}: {
  onClose: () => void;
  onUploaded?: (bookId: string) => void;
}) {
  const router = useRouter();
  const titleId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<BookUploadProgress | null>(null);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape' && !busy) {
        onClose();
      }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [busy, onClose]);

  function pickFile(next: File | null) {
    setError(null);
    setProgress(null);
    if (!next) {
      setFile(null);
      setTitle('');
      return;
    }
    const validation = BookUploadService.validate(next);
    if (!validation.ok) {
      setFile(null);
      setTitle('');
      setError(validation.error);
      return;
    }
    setFile(next);
    setTitle(BookUploadService.suggestedTitle(next));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!file || busy) {
      return;
    }
    setBusy(true);
    setError(null);
    const result = await BookUploadService.uploadBook({
      file,
      title,
      onProgress: setProgress,
    });
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      setProgress(null);
      return;
    }
    onUploaded?.(result.bookId);
    router.refresh();
    onClose();
    router.push(ROUTES.book(result.bookId));
  }

  const progressLabel = (() => {
    if (!progress) return null;
    switch (progress.stage) {
      case 'validating':
        return 'Validating…';
      case 'analyzing':
        return 'Reading PDF…';
      case 'uploading':
        return 'Uploading to cloud…';
      case 'saving':
        return 'Saving book…';
      case 'done':
        return 'Done';
      default:
        return null;
    }
  })();

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label="Close upload dialog"
        disabled={busy}
        onClick={() => {
          if (!busy) onClose();
        }}
      />
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onSubmit={(e) => void handleSubmit(e)}
        className="relative z-10 w-full max-w-md rounded-xl border border-border bg-surface p-5 shadow-lg"
      >
        <h2 id={titleId} className="text-lg font-semibold text-foreground">
          Upload PDF
        </h2>
        <p className="mt-1 text-sm text-muted">
          Saves to your Tin Pata cloud library. Maximum {formatMaxWebPdfSize()} per file.
        </p>

        <div className="mt-5">
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf,.pdf"
            className="sr-only"
            onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
          />
          <button
            type="button"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
            className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-background/80 px-4 py-8 text-center hover:border-tint hover:bg-tint-muted/40"
          >
            <span className="text-sm font-medium text-foreground">
              {file ? 'Choose a different PDF' : 'Choose a PDF'}
            </span>
            <span className="text-xs text-muted">
              Up to {formatMaxWebPdfSize()} · {formatFileSize(MAX_WEB_PDF_BYTES)} limit
            </span>
          </button>
          {file ? (
            <p className="mt-2 truncate text-xs text-muted" title={file.name}>
              {file.name} · {formatFileSize(file.size)}
            </p>
          ) : null}
        </div>

        <div className="mt-4">
          <Input
            label="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={busy || !file}
            placeholder="Book title"
            required
          />
        </div>

        {progressLabel ? (
          <p className="mt-3 text-sm text-tint" aria-live="polite">
            {progressLabel}
          </p>
        ) : null}
        {error ? (
          <p className="mt-3 text-sm text-red-600" role="alert">
            {error}
          </p>
        ) : null}

        <div className="mt-5 flex justify-end gap-2">
          <Button type="button" variant="ghost" disabled={busy} onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={busy || !file}>
            {busy ? 'Uploading…' : 'Upload to cloud'}
          </Button>
        </div>
      </form>
    </div>
  );
}
