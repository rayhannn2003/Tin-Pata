'use server';

import { revalidatePath } from 'next/cache';

import { BookService } from '@/services/BookService';
import type { BookStatus } from '@/types/book';
import { isBookStatus } from '@/types/book';
import { ROUTES } from '@/utils/constants';

export async function renameBookAction(
  bookId: string,
  title: string,
): Promise<{ ok: boolean; error?: string }> {
  const result = await BookService.rename(bookId, title);
  if (result.ok) {
    revalidatePath(ROUTES.library);
    revalidatePath(ROUTES.book(bookId));
  }
  return result;
}

export async function updateBookStatusAction(
  bookId: string,
  status: string,
): Promise<{ ok: boolean; error?: string }> {
  if (!isBookStatus(status)) {
    return { ok: false, error: 'Invalid status.' };
  }
  const result = await BookService.updateStatus(bookId, status as BookStatus);
  if (result.ok) {
    revalidatePath(ROUTES.library);
    revalidatePath(ROUTES.book(bookId));
  }
  return result;
}

export async function deleteBookAction(
  bookId: string,
): Promise<{ ok: boolean; error?: string }> {
  const result = await BookService.softDelete(bookId);
  if (result.ok) {
    revalidatePath(ROUTES.library);
    revalidatePath(ROUTES.book(bookId));
  }
  return result;
}
