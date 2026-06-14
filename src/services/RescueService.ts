import { BookRepository } from '@/db/repositories/BookRepository';
import { ReflectionRepository } from '@/db/repositories/ReflectionRepository';
import type { Book } from '@/types';
import type { RescueOption, RescueStartResult } from '@/types/rescue';
import { nowIso } from '@/utils/date';
import { generateId } from '@/utils/ids';

export class RescueError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RescueError';
  }
}

const RESCUE_OPTIONS: RescueOption[] = [
  {
    id: 'one_page',
    label: 'Read 1 page',
    description: 'One page is enough. Small progress counts.',
  },
  {
    id: 'three_minutes',
    label: 'Read for 3 minutes',
    description: 'Read for 3 minutes. No pressure.',
  },
  {
    id: 'continue',
    label: 'Continue last book',
    description: 'Pick up where you left off.',
  },
  {
    id: 'reflect',
    label: 'Write why I am stuck',
    description: 'Name what is in the way. Restart gently.',
  },
];

function buildReaderRoute(bookId: string, params: Record<string, string>): string {
  const query = new URLSearchParams(params).toString();
  return query ? `/reader/${bookId}?${query}` : `/reader/${bookId}`;
}

export const RescueService = {
  getRescueOptions(): RescueOption[] {
    return RESCUE_OPTIONS;
  },

  getRecoveryMessage(): string {
    return 'You are not behind. Just continue.';
  },

  async getLastReadingBook(): Promise<Book | null> {
    return BookRepository.getLastReadingBook();
  },

  async startOnePageRescue(): Promise<RescueStartResult> {
    const book = await this.getLastReadingBook();
    if (!book) {
      throw new RescueError('Import a PDF or open a book from your library first.');
    }
    return {
      book,
      route: buildReaderRoute(book.id, {
        mode: 'rescue',
        rescueType: 'one_page',
        pageTarget: '1',
      }),
    };
  },

  async startThreeMinuteRescue(): Promise<RescueStartResult> {
    const book = await this.getLastReadingBook();
    if (!book) {
      throw new RescueError('Import a PDF or open a book from your library first.');
    }
    return {
      book,
      route: buildReaderRoute(book.id, {
        mode: 'rescue',
        rescueType: 'three_minutes',
        minuteTarget: '3',
      }),
    };
  },

  async startContinueRescue(): Promise<RescueStartResult> {
    const book = await this.getLastReadingBook();
    if (!book) {
      throw new RescueError('No book to continue yet. Import a PDF to start.');
    }
    return {
      book,
      route: `/reader/${book.id}`,
    };
  },

  async saveStuckReflection(text: string, bookId?: string | null): Promise<void> {
    const trimmed = text.trim();
    if (!trimmed) {
      throw new RescueError('Write a few words about what feels stuck.');
    }
    await ReflectionRepository.createReflection({
      id: await generateId(),
      text: trimmed,
      bookId: bookId ?? null,
      createdAt: nowIso(),
    });
  },
};
