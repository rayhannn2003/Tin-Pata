import { createClient } from '@/lib/supabase/client';
import type { Profile } from '@/types/profile';

function mapProfile(row: {
  id: string;
  email: string | null;
  display_name: string | null;
  created_at: string;
  updated_at: string;
}): Profile {
  return {
    id: row.id,
    email: row.email,
    displayName: row.display_name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const ProfileService = {
  async getCurrent(): Promise<Profile | null> {
    const client = createClient();
    if (!client) {
      return null;
    }
    const {
      data: { user },
    } = await client.auth.getUser();
    if (!user) {
      return null;
    }

    const { data, error } = await client
      .from('profiles')
      .select('id, email, display_name, created_at, updated_at')
      .eq('id', user.id)
      .maybeSingle();

    if (error || !data) {
      return {
        id: user.id,
        email: user.email ?? null,
        displayName: null,
        createdAt: user.created_at,
        updatedAt: user.updated_at ?? user.created_at,
      };
    }

    return mapProfile(data);
  },

  async updateDisplayName(displayName: string): Promise<{ ok: boolean; error?: string }> {
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

    const trimmed = displayName.trim();
    const now = new Date().toISOString();

    const { data: existing } = await client
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .maybeSingle();

    if (existing) {
      const { error } = await client
        .from('profiles')
        .update({
          display_name: trimmed || null,
          email: user.email ?? null,
          updated_at: now,
        })
        .eq('id', user.id);
      return error ? { ok: false, error: error.message } : { ok: true };
    }

    const { error } = await client.from('profiles').insert({
      id: user.id,
      email: user.email ?? null,
      display_name: trimmed || null,
      created_at: now,
      updated_at: now,
    });
    return error ? { ok: false, error: error.message } : { ok: true };
  },
};
