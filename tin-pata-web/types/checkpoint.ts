export interface ReaderCheckpoint {
  id: string;
  bookId: string;
  pageNumber: number;
  /** Vertical position as a fraction of page height (0–1). */
  yRatio: number;
  /** Horizontal start as a fraction of page width (0–1). */
  xStartRatio: number;
  /** Horizontal end as a fraction of page width (0–1). */
  xEndRatio: number;
  /** ISO timestamp when the checkpoint was drawn. */
  createdAt: string;
}

export type CheckpointCreateInput = Omit<ReaderCheckpoint, 'id' | 'createdAt'>;
