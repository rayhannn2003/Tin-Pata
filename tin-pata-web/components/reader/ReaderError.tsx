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
  const title =
    unavailable || error.kind === 'unavailable'
      ? 'This book is not available on this device'
      : error.kind === 'corrupt'
        ? 'Could not open this PDF'
        : error.kind === 'permission'
          ? 'Permission denied'
          : error.kind === 'network'
            ? 'Network problem'
            : 'Something went wrong';

  const description =
    unavailable || error.kind === 'unavailable'
      ? 'The PDF is not in cloud storage yet. Sync or upload it from the Tin Pata mobile app first.'
      : error.message;

  return (
    <div className="flex h-full min-h-[50vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="max-w-md rounded-xl border border-border bg-surface px-6 py-10 shadow-sm">
        <h1 className="text-lg font-semibold text-foreground">{title}</h1>
        <p className="mt-2 text-sm text-muted">{description}</p>
        <div className="mt-6 flex flex-col items-center gap-3">
          <button
            type="button"
            disabled
            title="Cloud download UI arrives with the full sync engine"
            className="inline-flex w-full items-center justify-center rounded-md bg-tint px-4 py-2 text-sm font-medium text-white opacity-50"
          >
            Download from cloud
          </button>
          <p className="text-xs text-muted">
            Download is not implemented in this phase. Ensure the file is synced from mobile.
          </p>
          {onRetry && error.kind !== 'unavailable' ? (
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
