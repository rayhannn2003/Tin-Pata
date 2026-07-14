import { createClient } from '@/lib/supabase/client';

export const PDF_CLOUD_BUCKET = 'user-pdfs';
const SIGNED_URL_TTL_SECONDS = 3600;

export const PdfStorageService = {
  async createSignedUrl(
    cloudStoragePath: string | null | undefined,
  ): Promise<{ url: string | null; error?: string; kind?: 'permission' | 'network' | 'unavailable' }> {
    if (!cloudStoragePath?.trim()) {
      return { url: null, kind: 'unavailable', error: 'No cloud file path.' };
    }
    const client = createClient();
    if (!client) {
      return { url: null, kind: 'network', error: 'Supabase is not configured.' };
    }

    try {
      const { data, error } = await client.storage
        .from(PDF_CLOUD_BUCKET)
        .createSignedUrl(cloudStoragePath, SIGNED_URL_TTL_SECONDS);

      if (error || !data?.signedUrl) {
        const msg = error?.message ?? 'Could not create signed URL.';
        const kind =
          /permission|policy|403|401/i.test(msg) ? 'permission' : /network|fetch/i.test(msg) ? 'network' : 'unavailable';
        return { url: null, kind, error: msg };
      }
      return { url: data.signedUrl };
    } catch (err) {
      return {
        url: null,
        kind: 'network',
        error: err instanceof Error ? err.message : 'Network error.',
      };
    }
  },
};
