export const BookmarkService = {
  async listByBook(
    _userId: string,
    _bookId: string,
  ): Promise<import('@/types/bookmark').Bookmark[]> {
    void _userId;
    void _bookId;
    return [];
  },
};
