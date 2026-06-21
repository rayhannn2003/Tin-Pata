/** Maximum PDF size allowed for Supabase Storage cloud backup (50 MB). */
export const MAX_CLOUD_PDF_SIZE_BYTES = 50 * 1024 * 1024;

export const PDF_CLOUD_BUCKET = 'user-pdfs';

export function formatMaxCloudPdfSizeMb(): string {
  return '50 MB';
}

export function buildPdfStoragePath(userId: string, bookId: string): string {
  return `${userId}/books/${bookId}/original.pdf`;
}
