import { createClient } from '@/lib/supabase/server';
import { COVER_CLOUD_BUCKET } from '@/services/CoverStorageService';

const SIGNED_URL_TTL_SECONDS = 3600;

/** Server-only signed URL helper for RSC pages. */
export async function createCoverSignedUrl(
  coverImagePath: string | null | undefined,
): Promise<string | null> {
  if (!coverImagePath?.trim()) return null;
  const client = await createClient();
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
}
