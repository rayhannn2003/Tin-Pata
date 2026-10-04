'use client';

import Link from 'next/link';

import { Button } from '@/components/ui/Button';
import type { ReaderLoadError } from '@/types/reader';
import { ROUTES } from '@/utils/constants';

interface ReaderErrorProps {
  error: ReaderLoadError;
  onRetry?: () => void;
  unavailable?: boolean;
}

export function ReaderError({ error, onRetry, unavailable }: ReaderErrorProps) {
  const isUnavailable = unavailable || error.kind === 'unavailable';

  const title = isUnavailable
    ? 'PDF not in cloud storage'
    : error.kind === 'corrupt'
      ? 'Could not open this PDF'
      : error.kind === 'permission'
        ? 'Permission denied'
        : error.kind === 'network'
          ? 'Network problem'
          : 'Something went wrong';

  const description = isUnavailable
    ? 'This book’s metadata is synced, but the PDF file was never uploaded to cloud. On the Tin Pata mobile app, open the book and tap “Back up to cloud”, or upload the PDF from the web library.'
    : error.message;

  return (
    <div className="flex h-full min-h-[50vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="max-w-md rounded-xl border border-border bg-surface px-6 py-10 shadow-sm">
        <h1 className="text-lg font-semibold text-foreground">{title}</h1>
        <p className="mt-2 text-sm text-muted">{description}</p>
        <div className="mt-6 flex flex-col items-center gap-3">
          {isUnavailable ? (
            <>
              <Link
                href={ROUTES.library}
                className="inline-flex w-full items-center justify-center rounded-md bg-tint px-4 py-2 text-sm font-medium text-white hover:opacity-90"
              >
                Upload PDF from library
              </Link>
              <p className="text-xs text-muted">
                Web reads PDFs via a signed cloud URL — there is no separate “download to browser”
                step. The mobile app must back up the file first (or upload a new copy on web).
              </p>
            </>
          ) : null}
          {onRetry && !isUnavailable ? (
            <Button type="button" variant="secondary" onClick={onRetry} className="w-full">
              Retry
            </Button>
          ) : null}
          <Link href={ROUTES.library} className="text-sm font-medium text-tint hover:underline">
            Back to library
          </Link>
        </div>
      </div>
    </div>
  );
}
