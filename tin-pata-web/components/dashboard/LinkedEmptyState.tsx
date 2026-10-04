'use client';

import Link from 'next/link';

import { DashboardEmptyState } from '@/components/dashboard/EmptyState';
import { ROUTES } from '@/utils/constants';

interface EmptyStateProps {
  title: string;
  description?: string;
  href?: string;
  actionLabel?: string;
}

export function LinkedEmptyState({ title, description, href, actionLabel }: EmptyStateProps) {
  return (
    <div className="space-y-3">
      <DashboardEmptyState title={title} description={description} />
      {href && actionLabel ? (
        <div className="text-center">
          <Link
            href={href}
            className="inline-flex rounded-md bg-tint px-4 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            {actionLabel}
          </Link>
        </div>
      ) : null}
    </div>
  );
}

export function GoToLibraryLink() {
  return (
    <Link href={ROUTES.library} className="text-sm font-medium text-tint hover:underline">
      Open library
    </Link>
  );
}
