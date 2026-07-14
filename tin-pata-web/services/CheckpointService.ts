import type { CheckpointCreateInput, ReaderCheckpoint } from '@/types/checkpoint';
import { storage } from '@/utils/storage';

const PREFIX = 'tinpata.checkpoints.v1.';

function key(bookId: string) {
  return `${PREFIX}${bookId}`;
}

function read(bookId: string): ReaderCheckpoint[] {
  try {
    const raw = storage.get(key(bookId));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is ReaderCheckpoint =>
        Boolean(item) &&
        typeof item === 'object' &&
        typeof (item as ReaderCheckpoint).id === 'string' &&
        typeof (item as ReaderCheckpoint).pageNumber === 'number',
    );
  } catch {
    return [];
  }
}

function write(bookId: string, rows: ReaderCheckpoint[]) {
  storage.set(key(bookId), JSON.stringify(rows));
}

export const CheckpointService = {
  list(bookId: string): ReaderCheckpoint[] {
    return read(bookId).sort((a, b) => {
      if (a.pageNumber !== b.pageNumber) return a.pageNumber - b.pageNumber;
      return a.yRatio - b.yRatio;
    });
  },

  create(input: CheckpointCreateInput): ReaderCheckpoint {
    const checkpoint: ReaderCheckpoint = {
      ...input,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      xStartRatio: Math.min(input.xStartRatio, input.xEndRatio),
      xEndRatio: Math.max(input.xStartRatio, input.xEndRatio),
      yRatio: Math.min(1, Math.max(0, input.yRatio)),
    };
    const next = [...read(input.bookId), checkpoint];
    write(input.bookId, next);
    return checkpoint;
  },

  remove(bookId: string, id: string): void {
    write(
      bookId,
      read(bookId).filter((row) => row.id !== id),
    );
  },

  clearBook(bookId: string): void {
    storage.remove(key(bookId));
  },
};
