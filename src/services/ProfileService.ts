import { getSupabaseClient, isSupabaseConfigured } from '@/lib/supabase';
import type { Profile } from '@/types/auth';

interface ProfileRow {
  id: string;
  email: string | null;
  display_name: string | null;
  created_at: string;
  updated_at: string;
}

function mapRow(row: ProfileRow): Profile {
  return {
    id: row.id,
    email: row.email,
    displayName: row.display_name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const ProfileService = {
  isConfigured(): boolean {
    return isSupabaseConfigured;
  },

  async fetchProfile(userId: string): Promise<Profile | null> {
    const client = getSupabaseClient();
    if (!client) {
      return null;
    }

    const { data, error } = await client
      .from('profiles')
      .select('id, email, display_name, created_at, updated_at')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return data ? mapRow(data as ProfileRow) : null;
  },

  async createProfile(userId: string, email: string | null): Promise<Profile> {
    const client = getSupabaseClient();
    if (!client) {
      throw new Error('Supabase is not configured.');
    }

    const now = new Date().toISOString();
    const { data, error } = await client
      .from('profiles')
      .insert({
        id: userId,
        email,
        display_name: null,
        updated_at: now,
      })
      .select('id, email, display_name, created_at, updated_at')
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return mapRow(data as ProfileRow);
  },

  async ensureProfile(userId: string, email: string | null): Promise<Profile | null> {
    if (!isSupabaseConfigured) {
      return null;
    }

    const existing = await this.fetchProfile(userId);
    if (existing) {
      return existing;
    }

    try {
      return await this.createProfile(userId, email);
    } catch {
      return (await this.fetchProfile(userId)) ?? null;
    }
  },

  async updateDisplayName(userId: string, displayName: string): Promise<Profile> {
    const client = getSupabaseClient();
    if (!client) {
      throw new Error('Supabase is not configured.');
    }

    const trimmed = displayName.trim();
    const { data, error } = await client
      .from('profiles')
      .update({
        display_name: trimmed.length > 0 ? trimmed : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select('id, email, display_name, created_at, updated_at')
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return mapRow(data as ProfileRow);
  },
};
