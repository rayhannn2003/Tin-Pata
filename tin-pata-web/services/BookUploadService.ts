import { createClient } from '@/lib/supabase/client';
import { PDF_CLOUD_BUCKET } from '@/services/PdfStorageService';
import { getOrCreateWebDeviceId } from '@/utils/deviceId';

/** Web upload limit (mobile cloud backup allows 50MB). */
export const MAX_WEB_PDF_BYTES = 20 * 1024 * 1024;

export function formatMaxWebPdfSize(): string {
  return '20 MB';
}

export type BookUploadProgress =
  | { stage: 'validating' }
  | { stage: 'analyzing' }
  | { stage: 'uploading'; percent: number | null }
  | { stage: 'saving' }
  | { stage: 'done'; bookId: string };

function titleFromFileName(fileName: string): string {
  const base = fileName.replace(/\.pdf$/i, '').trim();
  return base || 'Untitled book';
}

function isPdfFile(file: File): boolean {
  if (file.type === 'application/pdf') {
    return true;
  }
  return file.name.toLowerCase().endsWith('.pdf');
}

async function sha256Hex(buffer: ArrayBuffer): Promise<string | null> {
  try {
    const hash = await crypto.subtle.digest('SHA-256', buffer);
    return Array.from(new Uint8Array(hash))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  } catch {
    return null;
  }
}

async function countPdfPages(data: Uint8Array): Promise<number> {
  try {
    const pdfjs = await import('pdfjs-dist');
    pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
    const doc = await pdfjs.getDocument({ data }).promise;
    const pages = doc.numPages;
    await doc.destroy();
    return pages;
  } catch {
    return 0;
  }
}

export const BookUploadService = {
  validate(file: File): { ok: true } | { ok: false; error: string } {
    if (!isPdfFile(file)) {
      return { ok: false, error: 'Only PDF files are supported.' };
    }
    if (file.size <= 0) {
      return { ok: false, error: 'This file is empty.' };
    }
    if (file.size > MAX_WEB_PDF_BYTES) {
      return {
        ok: false,
        error: `PDF must be ${formatMaxWebPdfSize()} or smaller.`,
      };
    }
    return { ok: true };
  },

  suggestedTitle(file: File): string {
    return titleFromFileName(file.name);
  },

  async uploadBook(options: {
    file: File;
    title: string;
    onProgress?: (progress: BookUploadProgress) => void;
  }): Promise<{ ok: true; bookId: string } | { ok: false; error: string }> {
    const { file, title, onProgress } = options;
    onProgress?.({ stage: 'validating' });

    const validation = this.validate(file);
    if (!validation.ok) {
      return validation;
    }

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      return { ok: false, error: 'Please enter a book title.' };
    }

    const client = createClient();
    if (!client) {
      return { ok: false, error: 'Supabase is not configured.' };
    }

    const {
      data: { user },
    } = await client.auth.getUser();
    if (!user) {
      return { ok: false, error: 'You must be signed in to upload.' };
    }

    const bookId = crypto.randomUUID();
    const deviceId = getOrCreateWebDeviceId();
    const storagePath = `${user.id}/books/${bookId}/original.pdf`;

    onProgress?.({ stage: 'analyzing' });
    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    const [totalPages, sha256] = await Promise.all([countPdfPages(bytes.slice()), sha256Hex(buffer)]);

    onProgress?.({ stage: 'uploading', percent: null });
    const blob = new Blob([buffer], { type: 'application/pdf' });
    const { error: uploadError } = await client.storage
      .from(PDF_CLOUD_BUCKET)
      .upload(storagePath, blob, {
        contentType: 'application/pdf',
        upsert: true,
      });

    if (uploadError) {
      return {
        ok: false,
        error: uploadError.message || 'Upload to cloud storage failed.',
      };
    }

    onProgress?.({ stage: 'saving' });
    const now = new Date().toISOString();
    const { error: insertError } = await client.from('books').insert({
      id: bookId,
      user_id: user.id,
      device_id: deviceId,
      title: trimmedTitle,
      author: null,
      total_pages: totalPages,
      current_page: 1,
      current_page_updated_at: now,
      status: 'not_started',
      category: 'general',
      priority: 'normal',
      cloud_storage_path: storagePath,
      pdf_file_name: file.name,
      pdf_file_size: file.size,
      pdf_sha256: sha256,
      pdf_uploaded_at: now,
      pdf_cloud_available: true,
      pdf_cloud_deleted_at: null,
      created_at: now,
      updated_at: now,
      deleted_at: null,
    });

    if (insertError) {
      await client.storage.from(PDF_CLOUD_BUCKET).remove([storagePath]).catch(() => undefined);
      return {
        ok: false,
        error: insertError.message || 'Could not save book metadata.',
      };
    }

    onProgress?.({ stage: 'done', bookId });
    return { ok: true, bookId };
  },
};
