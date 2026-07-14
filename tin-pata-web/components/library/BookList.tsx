import { BookCard } from '@/components/library/BookCard';
import type { Book } from '@/types/book';

interface BookListProps {
  books: Book[];
}

export function BookList({ books }: BookListProps) {
  return (
    <ul className="flex flex-col gap-3" role="list">
      {books.map((book) => (
        <li key={book.id}>
          <BookCard book={book} layout="list" />
        </li>
      ))}
    </ul>
  );
}
