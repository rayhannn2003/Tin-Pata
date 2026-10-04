import * as DocumentPicker from 'expo-document-picker';
import { File } from 'expo-file-system';

import { BookRepository } from '@/db/repositories/BookRepository';
import { getSupabaseClient, isSupabaseAuthReady } from '@/lib/supabase';
import { AuthService } from '@/services/AuthService';
import { SyncEnqueueService } from '@/services/SyncEnqueueService';
import type { Book } from '@/types';

export const COVER_CLOUD_BUCKET = 'user-covers';
export const MAX_COVER_BYTES = 5 * 1024 * 1024;

export class CoverCloudError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CoverCloudError';
  }
}

function buildCoverStoragePath(userId: string, bookId: string, ext: string): string {
  return `${userId}/books/${bookId}/cover.${ext}`;
}

function extensionFromMimeOrName(mimeType: string | undefined, fileName: string): string {
  const lower = fileName.toLowerCase();
  if (lower.endsWith('.png') || mimeType === 'image/png') return 'png';
  if (lower.endsWith('.webp') || mimeType === 'image/webp') return 'webp';
  return 'jpg';
}

async function requireAuthUserId(): Promise<string> {
  if (!isSupabaseAuthReady()) {
    throw new CoverCloudError('Cloud storage is not configured.');
  }
  const user = await AuthService.getCurrentUser();
  if (!user) {
    throw new CoverCloudError('Sign in to upload a cover.');
  }
  return user.id;
}

export const CoverCloudStorageService = {
  async pickCoverImage(): Promise<DocumentPicker.DocumentPickerAsset | null> {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['image/jpeg', 'image/png', 'image/webp'],
      copyToCacheDirectory: true,
      multiple: false,
    });
    if (result.canceled || result.assets.length === 0) {
      return null;
    }
    return result.assets[0];
  },

  async uploadCoverForBook(bookId: string): Promise<Book> {
    const userId = await requireAuthUserId();
    const book = await BookRepository.getBookById(bookId);
    if (!book) {
      throw new CoverCloudError('Book not found.');
    }

    const picked = await this.pickCoverImage();
    if (!picked?.uri) {
      throw new CoverCloudError('No image selected.');
    }

    const file = new File(picked.uri);
    if (!file.exists) {
      throw new CoverCloudError('Could not read the selected image.');
    }
    const size = file.info().size ?? picked.size ?? 0;
    if (size > MAX_COVER_BYTES) {
      throw new CoverCloudError('Cover image must be 5 MB or smaller.');
    }

    const ext = extensionFromMimeOrName(picked.mimeType, picked.name);
    const path = buildCoverStoragePath(userId, bookId, ext);
    const client = getSupabaseClient();
    if (!client) {
      throw new CoverCloudError('Cloud storage is not configured.');
    }

    const response = await fetch(picked.uri);
    if (!response.ok) {
      throw new CoverCloudError('Could not read the selected image.');
    }
    const blob = await response.blob();

    const { error: uploadError } = await client.storage.from(COVER_CLOUD_BUCKET).upload(path, blob, {
      contentType: picked.mimeType || 'image/jpeg',
      upsert: true,
    });
    if (uploadError) {
      throw new CoverCloudError(uploadError.message);
    }

    await BookRepository.updateBook(bookId, { coverImagePath: path });
    await SyncEnqueueService.onBookChanged(bookId);
    const updated = await BookRepository.getBookById(bookId);
    if (!updated) {
      throw new CoverCloudError('Book not found after upload.');
    }
    return updated;
  },

  async removeCoverForBook(bookId: string): Promise<Book> {
    await requireAuthUserId();
    const book = await BookRepository.getBookById(bookId);
    if (!book) {
      throw new CoverCloudError('Book not found.');
    }

    const client = getSupabaseClient();
    if (!client) {
      throw new CoverCloudError('Cloud storage is not configured.');
    }

    if (book.coverImagePath) {
      await client.storage.from(COVER_CLOUD_BUCKET).remove([book.coverImagePath]);
    }

    await BookRepository.updateBook(bookId, { coverImagePath: null });
    await SyncEnqueueService.onBookChanged(bookId);
    const updated = await BookRepository.getBookById(bookId);
    if (!updated) {
      throw new CoverCloudError('Book not found after remove.');
    }
    return updated;
  },

  async getSignedCoverUrl(coverImagePath: string | null | undefined): Promise<string | null> {
    if (!coverImagePath) return null;
    const client = getSupabaseClient();
    if (!client) return null;
    const { data, error } = await client.storage
      .from(COVER_CLOUD_BUCKET)
      .createSignedUrl(coverImagePath, 3600);
    if (error || !data?.signedUrl) return null;
    return data.signedUrl;
  },
};
