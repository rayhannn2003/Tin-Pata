'use client';

import { useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/Button';
import { CoverStorageService, formatMaxCoverSize } from '@/services/CoverStorageService';

interface ChangeCoverDialogProps {
  bookId: string;
  open: boolean;
  onClose: () => void;
  hasCover: boolean;
}

export function ChangeCoverDialog({ bookId, open, onClose, hasCover }: ChangeCoverDialogProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);

  if (!open) return null;

  function onPick(next: File | null) {
    setError(null);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setFile(null);
    if (!next) return;
    const check = CoverStorageService.validate(next);
    if (!check.ok) {
      setError(check.error);
      return;
    }
    setFile(next);
    setPreview(URL.createObjectURL(next));
  }

  function handleUpload() {
    if (!file) {
      setError('Choose an image first.');
      return;
    }
    startTransition(async () => {
      const result = await CoverStorageService.uploadCover({ bookId, file });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      onClose();
      router.refresh();
    });
  }

  function handleRemove() {
    startTransition(async () => {
      const result = await CoverStorageService.removeCover(bookId);
      if (!result.ok) {
        setError(result.error ?? 'Could not remove cover.');
        return;
      }
      onClose();
      router.refresh();
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div
        role="dialog"
        aria-modal
        aria-labelledby="change-cover-title"
        className="w-full max-w-md rounded-xl border border-border bg-surface p-5 shadow-lg"
      >
        <h2 id="change-cover-title" className="text-lg font-semibold text-foreground">
          Change cover
        </h2>
        <p className="mt-1 text-sm text-muted">
          JPG, PNG, or WebP up to {formatMaxCoverSize()}.
        </p>

        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => onPick(e.target.files?.[0] ?? null)}
        />

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="mt-4 flex h-40 w-full items-center justify-center overflow-hidden rounded-lg border border-dashed border-border bg-background hover:bg-tint-muted"
        >
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="Cover preview" className="h-full w-full object-cover" />
          ) : (
            <span className="text-sm text-muted">Choose image</span>
          )}
        </button>

        {error ? (
          <p className="mt-3 text-sm text-red-600" role="alert">
            {error}
          </p>
        ) : null}

        <div className="mt-4 flex flex-wrap gap-2">
          <Button type="button" disabled={pending || !file} onClick={handleUpload}>
            {pending ? 'Saving…' : 'Save cover'}
          </Button>
          {hasCover ? (
            <Button type="button" variant="secondary" disabled={pending} onClick={handleRemove}>
              Remove cover
            </Button>
          ) : null}
          <Button type="button" variant="secondary" disabled={pending} onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
