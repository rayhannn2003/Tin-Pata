import { BookDetailSkeleton } from '@/components/library/BookSkeleton';

export default function BookDetailLoading() {
  return (
    <div className="mx-auto max-w-6xl">
      <BookDetailSkeleton />
    </div>
  );
}
