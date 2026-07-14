export interface ReadingSession {
  id: string;
  userId: string;
  bookId: string;
  startPage: number;
  endPage: number;
  pagesRead: number;
  durationSeconds: number;
  focusLevel: number | null;
  mood: string | null;
  blockerReason: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}
