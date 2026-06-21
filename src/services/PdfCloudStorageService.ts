import * as Crypto from 'expo-crypto';
import { File } from 'expo-file-system';

import {
  MAX_CLOUD_PDF_SIZE_BYTES,
  PDF_CLOUD_BUCKET,
  buildPdfStoragePath,
} from '@/constants/pdfCloud';
import { BookRepository } from '@/db/repositories/BookRepository';
import { getSupabaseClient, isSupabaseAuthReady } from '@/lib/supabase';
import { AuthService } from '@/services/AuthService';
import { SyncEnqueueService } from '@/services/SyncEnqueueService';
import type { Book } from '@/types';
import type { PdfCloudStatus } from '@/types/pdfCloud';
import {
  buildPdfCloudStatus,
  canUploadPdf as checkCanUploadPdf,
} from '@/utils/pdfCloudStatus';
import { nowIso } from '@/utils/syncMetadata';
import {
  PdfStorageError,
  ensurePdfDirectory,
  getLocalPdfUri,
  fileExistsForBook,
} from '@/storage/pdfStorage';

export class PdfCloudError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PdfCloudError';
  }
}

async function requireAuthUserId(): Promise<string> {
  if (!isSupabaseAuthReady()) {
    throw new PdfCloudError('Cloud backup is not configured.');
  }
  const user = await AuthService.getCurrentUser();
  if (!user) {
    throw new PdfCloudError('Sign in to use PDF cloud backup.');
  }
  return user.id;
}

function requireClient() {
  const client = getSupabaseClient();
  if (!client) {
    throw new PdfCloudError('Cloud backup is not configured.');
  }
  return client;
}

async function loadBook(bookId: string): Promise<Book> {
  const book = await BookRepository.getBookById(bookId);
  if (!book) {
    throw new PdfCloudError('Book not found.');
  }
  return book;
}

async function syncBookMetadata(bookId: string): Promise<void> {
  await SyncEnqueueService.onBookChanged(bookId);
}

export const PdfCloudStorageService = {
  async getPdfCloudStatus(bookId: string, isLoggedIn?: boolean): Promise<PdfCloudStatus> {
    const book = await loadBook(bookId);
    const loggedIn =
      isLoggedIn ?? Boolean(isSupabaseAuthReady() && (await AuthService.getCurrentUser()));
    return buildPdfCloudStatus(book, loggedIn);
  },

  canUploadPdf(book: Book, isLoggedIn: boolean) {
    return checkCanUploadPdf(book, isLoggedIn);
  },

  async calculateFileSize(uri: string): Promise<number | null> {
    try {
      const file = new File(uri);
      if (!file.exists) {
        return null;
      }
      const size = file.info().size;
      return typeof size === 'number' && size >= 0 ? size : null;
    } catch {
      return null;
    }
  },

  async calculateSha256(uri: string): Promise<string | null> {
    try {
      const file = new File(uri);
      if (!file.exists) {
        return null;
      }
      const size = file.info().size ?? 0;
      if (size <= 0 || size > MAX_CLOUD_PDF_SIZE_BYTES) {
        return null;
      }
      const base64 = await file.base64();
      return await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, base64, {
        encoding: Crypto.CryptoEncoding.BASE64,
      });
    } catch {
      return null;
    }
  },

  async getSignedPdfUrl(book: Pick<Book, 'cloudStoragePath'>): Promise<string | null> {
    if (!book.cloudStoragePath) {
      return null;
    }
    const client = requireClient();
    const { data, error } = await client.storage
      .from(PDF_CLOUD_BUCKET)
      .createSignedUrl(book.cloudStoragePath, 3600);
    if (error || !data?.signedUrl) {
      return null;
    }
    return data.signedUrl;
  },

  async uploadPdfForBook(bookId: string): Promise<Book> {
    const userId = await requireAuthUserId();
    const book = await loadBook(bookId);
    const loggedIn = true;
    const check = checkCanUploadPdf(book, loggedIn);
    if (!check.ok) {
      throw new PdfCloudError('This PDF cannot be uploaded to cloud.');
    }

    const localUri = getLocalPdfUri(bookId);
    if (!fileExistsForBook(bookId)) {
      throw new PdfCloudError('Local PDF file is missing.');
    }

    const fileSize = check.fileSizeBytes ?? (await this.calculateFileSize(localUri));
    if (fileSize === null) {
      throw new PdfCloudError('Could not determine PDF file size.');
    }
    if (fileSize > MAX_CLOUD_PDF_SIZE_BYTES) {
      throw new PdfCloudError('This PDF is larger than 50 MB.');
    }

    const storagePath = buildPdfStoragePath(userId, bookId);
    const client = requireClient();

    const response = await fetch(localUri);
    if (!response.ok) {
      throw new PdfCloudError('Could not read the local PDF file.');
    }
    const blob = await response.blob();

    const { error: uploadError } = await client.storage
      .from(PDF_CLOUD_BUCKET)
      .upload(storagePath, blob, {
        contentType: 'application/pdf',
        upsert: true,
      });

    if (uploadError) {
      throw new PdfCloudError(uploadError.message);
    }

    const sha256 = await this.calculateSha256(localUri);
    const uploadedAt = nowIso();

    await BookRepository.updateBook(bookId, {
      cloudStoragePath: storagePath,
      pdfFileName: book.fileName,
      pdfFileSize: fileSize,
      pdfSha256: sha256,
      pdfUploadedAt: uploadedAt,
      pdfCloudAvailable: true,
      pdfCloudDeletedAt: null,
      isUploaded: true,
    });

    await syncBookMetadata(bookId);
    const updated = await loadBook(bookId);
    return updated;
  },

  async downloadPdfForBook(bookId: string): Promise<Book> {
    await requireAuthUserId();
    const book = await loadBook(bookId);
    if (!book.pdfCloudAvailable || !book.cloudStoragePath) {
      throw new PdfCloudError('No cloud PDF is available for this book.');
    }

    const client = requireClient();
    const { data, error } = await client.storage
      .from(PDF_CLOUD_BUCKET)
      .download(book.cloudStoragePath);

    if (error || !data) {
      throw new PdfCloudError(error?.message ?? 'Download failed.');
    }

    const arrayBuffer = await data.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    const directory = await ensurePdfDirectory();
    const destination = new File(directory, `${bookId}.pdf`);

    if (destination.exists) {
      destination.delete();
    }

    destination.write(bytes);

    if (!destination.exists) {
      throw new PdfCloudError('Could not save the downloaded PDF.');
    }

    const fileSize = destination.info().size ?? bytes.byteLength;
    const localUri = destination.uri;

    await BookRepository.updateBook(bookId, {
      localUri,
      fileName: book.pdfFileName ?? book.fileName,
      fileSize: fileSize || book.pdfFileSize || book.fileSize,
      isDownloaded: true,
    });

    await syncBookMetadata(bookId);
    return loadBook(bookId);
  },

  async deleteCloudPdfForBook(bookId: string): Promise<Book> {
    await requireAuthUserId();
    const book = await loadBook(bookId);
    if (!book.pdfCloudAvailable || !book.cloudStoragePath) {
      throw new PdfCloudError('No cloud PDF to delete.');
    }

    const client = requireClient();
    const { error } = await client.storage.from(PDF_CLOUD_BUCKET).remove([book.cloudStoragePath]);
    if (error) {
      throw new PdfCloudError(error.message);
    }

    const deletedAt = nowIso();
    await BookRepository.updateBook(bookId, {
      pdfCloudAvailable: false,
      cloudStoragePath: null,
      pdfUploadedAt: null,
      pdfCloudDeletedAt: deletedAt,
      isUploaded: false,
    });

    await syncBookMetadata(bookId);
    return loadBook(bookId);
  },
};

export { PdfStorageError };
