'use client';

import dynamic from 'next/dynamic';

import { ReaderLoading } from '@/components/reader/ReaderLoading';
import type { Book } from '@/types/book';

const ReaderExperience = dynamic(
  () =>
    import('@/components/reader/ReaderExperience').then((mod) => mod.ReaderExperience),
  {
    ssr: false,
    loading: () => <ReaderLoading />,
  },
);

export function ReaderPageClient({ book }: { book: Book }) {
  return <ReaderExperience book={book} />;
}
