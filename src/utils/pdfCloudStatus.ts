import { File } from 'expo-file-system';

import {
  MAX_CLOUD_PDF_SIZE_BYTES,
} from '@/constants/pdfCloud';
import type { Book } from '@/types';
import type { PdfCloudBadge, PdfCloudStatus, PdfCloudUploadCheck } from '@/types/pdfCloud';
import { PdfAvailabilityService } from '@/services/PdfAvailabilityService';
import { getLocalPdfUri } from '@/storage/pdfStorage';

export function emptyPdfCloudFields(): Pick<
  Book,
  | 'cloudStoragePath'
  | 'pdfFileName'
  | 'pdfFileSize'
  | 'pdfSha256'
  | 'pdfUploadedAt'
  | 'pdfCloudAvailable'
  | 'pdfCloudDeletedAt'
> {
  return {
    cloudStoragePath: null,
    pdfFileName: null,
    pdfFileSize: null,
    pdfSha256: null,
    pdfUploadedAt: null,
    pdfCloudAvailable: false,
    pdfCloudDeletedAt: null,
  };
}

export function resolveLocalFileSizeBytes(book: Pick<Book, 'fileSize' | 'localUri' | 'id'>): number | null {
  if (book.fileSize > 0) {
    return book.fileSize;
  }
  try {
    const uri = PdfAvailabilityService.isPdfAvailable(book) ? getLocalPdfUri(book.id) : book.localUri;
    const file = new File(uri);
    if (!file.exists) {
      return null;
    }
    const size = file.info().size;
    return typeof size === 'number' && size > 0 ? size : null;
  } catch {
    return null;
  }
}

export function isPdfTooLargeForCloud(book: Pick<Book, 'fileSize' | 'localUri' | 'id'>): boolean {
  const size = resolveLocalFileSizeBytes(book);
  if (size === null) {
    return false;
  }
  return size > MAX_CLOUD_PDF_SIZE_BYTES;
}

export function buildPdfCloudStatus(book: Book, isLoggedIn: boolean): PdfCloudStatus {
  const localAvailable = PdfAvailabilityService.isPdfAvailable(book);
  const cloudAvailable = book.pdfCloudAvailable && Boolean(book.cloudStoragePath);
  const fileSizeBytes = resolveLocalFileSizeBytes(book);
  const tooLarge = fileSizeBytes !== null && fileSizeBytes > MAX_CLOUD_PDF_SIZE_BYTES;

  let state: PdfCloudStatus['state'] = 'local_only';
  if (!isLoggedIn) {
    state = 'not_logged_in';
  } else if (!localAvailable && !cloudAvailable) {
    state = 'pdf_missing';
  } else if (!localAvailable && cloudAvailable) {
    state = 'cloud_available';
  } else if (tooLarge) {
    state = 'too_large';
  } else if (cloudAvailable && localAvailable) {
    state = 'backed_up';
  } else {
    state = 'local_only';
  }

  return {
    state,
    localAvailable,
    cloudAvailable,
    fileSizeBytes,
    canUpload:
      isLoggedIn &&
      localAvailable &&
      !tooLarge &&
      !cloudAvailable &&
      fileSizeBytes !== null &&
      fileSizeBytes <= MAX_CLOUD_PDF_SIZE_BYTES,
    canDownload: isLoggedIn && cloudAvailable && !localAvailable,
    canDeleteCloud: isLoggedIn && cloudAvailable,
    canRelink: !localAvailable && !cloudAvailable,
    maxSizeBytes: MAX_CLOUD_PDF_SIZE_BYTES,
    storagePath: book.cloudStoragePath,
  };
}

export function getPdfCloudBadge(
  book: Book,
  pdfMissing: boolean,
  isLoggedIn: boolean,
): PdfCloudBadge | null {
  if (pdfMissing && book.pdfCloudAvailable && book.cloudStoragePath) {
    return 'cloud_available';
  }
  if (pdfMissing) {
    return 'pdf_missing';
  }
  if (isLoggedIn && isPdfTooLargeForCloud(book)) {
    return 'too_large';
  }
  if (book.pdfCloudAvailable) {
    return 'cloud_backed_up';
  }
  if (isLoggedIn && PdfAvailabilityService.isPdfAvailable(book)) {
    return 'local_only';
  }
  return null;
}

export function canUploadPdf(book: Book, isLoggedIn: boolean): PdfCloudUploadCheck {
  if (!isLoggedIn) {
    return { ok: false, reasonKey: 'pdfCloud.signInToBackup' };
  }
  if (!PdfAvailabilityService.isPdfAvailable(book)) {
    return { ok: false, reasonKey: 'pdfCloud.uploadFailed' };
  }
  const fileSizeBytes = resolveLocalFileSizeBytes(book);
  if (fileSizeBytes === null) {
    return { ok: false, reasonKey: 'pdfCloud.uploadFailed' };
  }
  if (fileSizeBytes > MAX_CLOUD_PDF_SIZE_BYTES) {
    return { ok: false, reasonKey: 'pdfCloud.tooLarge', fileSizeBytes };
  }
  return { ok: true, fileSizeBytes };
}
