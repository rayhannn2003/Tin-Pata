import { notFound } from 'next/navigation';

import { ReaderPageClient } from '@/app/(dashboard)/dashboard/reader/[bookId]/ReaderPageClient';
import { BookService } from '@/services/BookService';

interface ReaderPageProps {
  params: Promise<{ bookId: string }>;
}

export default async function ReaderPage({ params }: ReaderPageProps) {
  const { bookId } = await params;
  const book = await BookService.getByIdForCurrentUser(bookId);
  if (!book) {
    notFound();
  }

  return <ReaderPageClient book={book} />;
}
