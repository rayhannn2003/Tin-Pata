export interface Bookmark {
  id: string;
  userId: string;
  bookId: string;
  pageNumber: number;
  title: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}
