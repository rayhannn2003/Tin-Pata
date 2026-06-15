import { SessionRepository } from '@/db/repositories/SessionRepository';
import { BookService } from '@/services/BookService';

export interface BookDeletionImpact {
  sessionCount: number;
  noteCount: number;
  bookmarkCount: number;
}

export async function getBookDeletionImpact(bookId: string): Promise<BookDeletionImpact> {
  const [sessions, counts] = await Promise.all([
    SessionRepository.getSessionsByBookId(bookId),
    BookService.getBookAnnotationCounts(bookId),
  ]);

  return {
    sessionCount: sessions.length,
    noteCount: counts.noteCount,
    bookmarkCount: counts.bookmarkCount,
  };
}
