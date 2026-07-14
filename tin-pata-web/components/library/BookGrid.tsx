import { BookCard } from '@/components/library/BookCard';
import type { Book } from '@/types/book';

interface BookGridProps {
  books: Book[];
}

export function BookGrid({ books }: BookGridProps) {
  return (
    <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3" role="list">
      {books.map((book) => (
        <li key={book.id}>
          <BookCard book={book} layout="grid" />
        </li>
      ))}
    </ul>
  );
}
