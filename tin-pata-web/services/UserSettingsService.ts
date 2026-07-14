import { createClient } from '@/lib/supabase/client';
import { getOrCreateWebDeviceId } from '@/utils/deviceId';
import type { DictionaryPreferences } from '@/types/dictionary';
import {
  DEFAULT_DICTIONARY_PREFERENCES,
  DICTIONARY_SETTING_KEYS,
} from '@/types/dictionary';
import type { ReaderPreferences } from '@/types/reader';
import { DEFAULT_READER_PREFERENCES, READER_SETTING_KEYS } from '@/types/reader';

async function requireUser() {
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
  return { client, userId: user.id, deviceId: getOrCreateWebDeviceId() };
}

export const UserSettingsService = {
  async getMany(keys: string[]): Promise<Record<string, string>> {
    const ctx = await requireUser();
    if (!ctx || keys.length === 0) {
      return {};
    }
    const { data, error } = await ctx.client
      .from('user_settings')
      .select('setting_key, setting_value')
      .eq('user_id', ctx.userId)
      .is('deleted_at', null)
      .in('setting_key', keys);

    if (error || !data) {
      return {};
    }
    const map: Record<string, string> = {};
    for (const row of data) {
      map[row.setting_key] = row.setting_value;
    }
    return map;
  },

  async set(key: string, value: string): Promise<{ ok: boolean; error?: string }> {
    const ctx = await requireUser();
    if (!ctx) {
      return { ok: false, error: 'Not signed in.' };
    }
    const now = new Date().toISOString();
    const row = {
      id: `${ctx.userId}:${key}`,
      user_id: ctx.userId,
      device_id: ctx.deviceId,
      setting_key: key,
      setting_value: value,
      created_at: now,
      updated_at: now,
      deleted_at: null,
    };

    const { data: existing } = await ctx.client
      .from('user_settings')
      .select('id, created_at')
      .eq('user_id', ctx.userId)
      .eq('setting_key', key)
      .maybeSingle();

    if (existing) {
      const { error } = await ctx.client
        .from('user_settings')
        .update({
          setting_value: value,
          device_id: ctx.deviceId,
          updated_at: now,
          deleted_at: null,
        })
        .eq('id', existing.id);
      return error ? { ok: false, error: error.message } : { ok: true };
    }

    const { error } = await ctx.client.from('user_settings').insert(row);
    return error ? { ok: false, error: error.message } : { ok: true };
  },

  async loadReaderPreferences(): Promise<ReaderPreferences> {
    const raw = await this.getMany(Object.values(READER_SETTING_KEYS));
    const zoomMode = raw[READER_SETTING_KEYS.zoomMode];
    const zoomScale = Number(raw[READER_SETTING_KEYS.zoomScale]);
    const theme = raw[READER_SETTING_KEYS.theme];

    return {
      zoomMode:
        zoomMode === 'custom' || zoomMode === 'fit-width' || zoomMode === 'fit-page'
          ? zoomMode
          : DEFAULT_READER_PREFERENCES.zoomMode,
      zoomScale:
        Number.isFinite(zoomScale) && zoomScale > 0
          ? Math.min(3, Math.max(0.5, zoomScale))
          : DEFAULT_READER_PREFERENCES.zoomScale,
      leftSidebarOpen: raw[READER_SETTING_KEYS.leftSidebar] !== '0',
      rightSidebarOpen: raw[READER_SETTING_KEYS.rightSidebar] !== '0',
      theme: theme === 'light' || theme === 'dark' || theme === 'system' ? theme : 'system',
    };
  },

  async saveReaderPreferences(partial: Partial<ReaderPreferences>): Promise<void> {
    const tasks: Promise<unknown>[] = [];
    if (partial.zoomMode != null) {
      tasks.push(this.set(READER_SETTING_KEYS.zoomMode, partial.zoomMode));
    }
    if (partial.zoomScale != null) {
      tasks.push(this.set(READER_SETTING_KEYS.zoomScale, String(partial.zoomScale)));
    }
    if (partial.leftSidebarOpen != null) {
      tasks.push(this.set(READER_SETTING_KEYS.leftSidebar, partial.leftSidebarOpen ? '1' : '0'));
    }
    if (partial.rightSidebarOpen != null) {
      tasks.push(this.set(READER_SETTING_KEYS.rightSidebar, partial.rightSidebarOpen ? '1' : '0'));
    }
    if (partial.theme != null) {
      tasks.push(this.set(READER_SETTING_KEYS.theme, partial.theme));
    }
    await Promise.all(tasks);
  },

  async loadDictionaryPreferences(): Promise<DictionaryPreferences> {
    const raw = await this.getMany(Object.values(DICTIONARY_SETTING_KEYS));
    const mode = raw[DICTIONARY_SETTING_KEYS.mode];
    return {
      mode:
        mode === 'en' || mode === 'bn-en' || mode === 'en-bn'
          ? mode
          : DEFAULT_DICTIONARY_PREFERENCES.mode,
      openOnDoubleClick: raw[DICTIONARY_SETTING_KEYS.openOnDoubleClick] !== '0',
      highlightOnPage: raw[DICTIONARY_SETTING_KEYS.highlightOnPage] !== '0',
      saveRecent: raw[DICTIONARY_SETTING_KEYS.saveRecent] !== '0',
    };
  },

  async saveDictionaryPreferences(partial: Partial<DictionaryPreferences>): Promise<void> {
    const tasks: Promise<unknown>[] = [];
    if (partial.mode != null) {
      tasks.push(this.set(DICTIONARY_SETTING_KEYS.mode, partial.mode));
    }
    if (partial.openOnDoubleClick != null) {
      tasks.push(
        this.set(
          DICTIONARY_SETTING_KEYS.openOnDoubleClick,
          partial.openOnDoubleClick ? '1' : '0',
        ),
      );
    }
    if (partial.highlightOnPage != null) {
      tasks.push(
        this.set(
          DICTIONARY_SETTING_KEYS.highlightOnPage,
          partial.highlightOnPage ? '1' : '0',
        ),
      );
    }
    if (partial.saveRecent != null) {
      tasks.push(
        this.set(DICTIONARY_SETTING_KEYS.saveRecent, partial.saveRecent ? '1' : '0'),
      );
    }
    await Promise.all(tasks);
  },
};
