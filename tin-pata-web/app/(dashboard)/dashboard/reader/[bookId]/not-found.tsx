import Link from 'next/link';

import { ROUTES } from '@/utils/constants';

export default function ReaderBookNotFound() {
  return (
    <div className="flex h-dvh items-center justify-center px-6">
      <div className="max-w-md rounded-xl border border-border bg-surface px-6 py-10 text-center shadow-sm">
        <h1 className="text-lg font-semibold text-foreground">Book not found</h1>
        <p className="mt-2 text-sm text-muted">This title is missing or no longer in your library.</p>
        <Link href={ROUTES.library} className="mt-6 inline-flex text-sm font-medium text-tint hover:underline">
          Back to library
        </Link>
      </div>
    </div>
  );
}
