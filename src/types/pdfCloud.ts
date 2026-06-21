import type { Book } from '@/types';

export type PdfCloudUiState =
  | 'not_logged_in'
  | 'local_only'
  | 'backed_up'
  | 'cloud_available'
  | 'pdf_missing'
  | 'too_large';

export type PdfCloudBadge =
  | 'local_only'
  | 'cloud_backed_up'
  | 'cloud_available'
  | 'pdf_missing'
  | 'too_large';

export interface PdfCloudStatus {
  state: PdfCloudUiState;
  localAvailable: boolean;
  cloudAvailable: boolean;
  fileSizeBytes: number | null;
  canUpload: boolean;
  canDownload: boolean;
  canDeleteCloud: boolean;
  canRelink: boolean;
  maxSizeBytes: number;
  storagePath: string | null;
}

export interface PdfCloudUploadCheck {
  ok: boolean;
  reasonKey?: string;
  fileSizeBytes?: number | null;
}

export type PdfCloudBook = Pick<
  Book,
  | 'id'
  | 'localUri'
  | 'fileName'
  | 'fileSize'
  | 'cloudStoragePath'
  | 'pdfFileName'
  | 'pdfFileSize'
  | 'pdfSha256'
  | 'pdfUploadedAt'
  | 'pdfCloudAvailable'
  | 'pdfCloudDeletedAt'
>;
