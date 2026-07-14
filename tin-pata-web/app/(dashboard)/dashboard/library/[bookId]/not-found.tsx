import Link from 'next/link';

import { ROUTES } from '@/utils/constants';

export default function BookNotFound() {
  return (
    <div className="mx-auto max-w-lg rounded-xl border border-border bg-surface px-6 py-12 text-center shadow-sm">
      <h1 className="text-xl font-semibold text-foreground">Book not found</h1>
      <p className="mt-2 text-sm text-muted">
        This book may have been deleted, or it is not in your library.
      </p>
      <Link
        href={ROUTES.library}
        className="mt-6 inline-flex rounded-md bg-tint px-4 py-2 text-sm font-medium text-white hover:opacity-90"
      >
        Back to library
      </Link>
    </div>
  );
}
