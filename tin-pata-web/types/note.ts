export interface Note {
  id: string;
  userId: string;
  bookId: string;
  pageNumber: number;
  noteText: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}
