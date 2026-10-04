import { createClient } from '@/lib/supabase/client';

export const COVER_CLOUD_BUCKET = 'user-covers';
export const MAX_COVER_BYTES = 5 * 1024 * 1024;
const SIGNED_URL_TTL_SECONDS = 3600;

export function buildCoverStoragePath(userId: string, bookId: string, ext: string): string {
  const safeExt = ext.replace(/^\./, '').toLowerCase() || 'jpg';
  return `${userId}/books/${bookId}/cover.${safeExt}`;
}

export function formatMaxCoverSize(): string {
  return '5 MB';
}

function extensionFromFile(file: File): string {
  const fromName = file.name.split('.').pop()?.toLowerCase();
  if (fromName && ['jpg', 'jpeg', 'png', 'webp'].includes(fromName)) {
    return fromName === 'jpeg' ? 'jpg' : fromName;
  }
  if (file.type === 'image/png') return 'png';
  if (file.type === 'image/webp') return 'webp';
  return 'jpg';
}

export const CoverStorageService = {
  validate(file: File): { ok: true } | { ok: false; error: string } {
    if (!file.type.startsWith('image/')) {
      return { ok: false, error: 'Only image files are supported (JPG, PNG, WebP).' };
    }
    if (file.size <= 0) {
      return { ok: false, error: 'This file is empty.' };
    }
    if (file.size > MAX_COVER_BYTES) {
      return { ok: false, error: `Cover must be ${formatMaxCoverSize()} or smaller.` };
    }
    return { ok: true };
  },

  async createSignedUrl(coverImagePath: string | null | undefined): Promise<string | null> {
    if (!coverImagePath?.trim()) return null;
    const client = createClient();
    if (!client) return null;
    try {
      const { data, error } = await client.storage
        .from(COVER_CLOUD_BUCKET)
        .createSignedUrl(coverImagePath, SIGNED_URL_TTL_SECONDS);
      if (error || !data?.signedUrl) return null;
      return data.signedUrl;
    } catch {
      return null;
    }
  },

  async uploadCover(options: {
    bookId: string;
    file: File;
  }): Promise<{ ok: true; path: string } | { ok: false; error: string }> {
    const check = this.validate(options.file);
    if (!check.ok) return check;

    const client = createClient();
    if (!client) {
      return { ok: false, error: 'Supabase is not configured.' };
    }

    const {
      data: { user },
    } = await client.auth.getUser();
    if (!user) {
      return { ok: false, error: 'Not signed in.' };
    }

    const ext = extensionFromFile(options.file);
    const path = buildCoverStoragePath(user.id, options.bookId, ext);

    const { error: uploadError } = await client.storage
      .from(COVER_CLOUD_BUCKET)
      .upload(path, options.file, {
        contentType: options.file.type || 'image/jpeg',
        upsert: true,
      });

    if (uploadError) {
      return { ok: false, error: uploadError.message };
    }

    const { error: updateError } = await client
      .from('books')
      .update({
        cover_image_path: path,
        updated_at: new Date().toISOString(),
      })
      .eq('id', options.bookId)
      .eq('user_id', user.id)
      .is('deleted_at', null);

    if (updateError) {
      return { ok: false, error: updateError.message };
    }

    return { ok: true, path };
  },

  async removeCover(bookId: string): Promise<{ ok: boolean; error?: string }> {
    const client = createClient();
    if (!client) {
      return { ok: false, error: 'Supabase is not configured.' };
    }
    const {
      data: { user },
    } = await client.auth.getUser();
    if (!user) {
      return { ok: false, error: 'Not signed in.' };
    }

    const { data: book } = await client
      .from('books')
      .select('cover_image_path')
      .eq('id', bookId)
      .eq('user_id', user.id)
      .maybeSingle();

    const path = book?.cover_image_path as string | null | undefined;
    if (path) {
      await client.storage.from(COVER_CLOUD_BUCKET).remove([path]);
    }

    const { error } = await client
      .from('books')
      .update({ cover_image_path: null, updated_at: new Date().toISOString() })
      .eq('id', bookId)
      .eq('user_id', user.id);

    return error ? { ok: false, error: error.message } : { ok: true };
  },
};
