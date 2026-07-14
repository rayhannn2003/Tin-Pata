import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { BookSkeleton } from '@/components/library/BookSkeleton';

export default function LibraryLoading() {
  return (
    <div className="mx-auto max-w-6xl">
      <DashboardHeader title="Library" description="Loading your books…" />
      <div className="mb-4 h-24 animate-pulse rounded-xl border border-border bg-surface" />
      <div className="mb-4 h-28 animate-pulse rounded-xl border border-border bg-surface" />
      <BookSkeleton count={6} />
    </div>
  );
}
