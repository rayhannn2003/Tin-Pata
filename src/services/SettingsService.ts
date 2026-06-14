import { resetDatabase } from '@/db/database';
import { SettingsRepository } from '@/db/repositories/SettingsRepository';

const ONBOARDING_KEY = 'has_seen_onboarding';

export const SettingsService = {
  async get(key: string): Promise<string | null> {
    return SettingsRepository.get(key);
  },

  async set(key: string, value: string): Promise<void> {
    return SettingsRepository.set(key, value);
  },

  async hasSeenOnboarding(): Promise<boolean> {
    const value = await SettingsRepository.get(ONBOARDING_KEY);
    return value === 'true';
  },

  async setHasSeenOnboarding(seen: boolean): Promise<void> {
    await SettingsRepository.set(ONBOARDING_KEY, seen ? 'true' : 'false');
  },

  async getTheme(): Promise<'light' | 'dark' | 'system'> {
    const value = await SettingsRepository.get('theme_preference');
    if (value === 'light' || value === 'dark' || value === 'system') {
      return value;
    }
    const legacy = await SettingsRepository.get('theme');
    if (legacy === 'light' || legacy === 'dark' || legacy === 'system') {
      return legacy;
    }
    return 'system';
  },

  async resetAllData(): Promise<void> {
    try {
      const { NotificationService } = await import('@/services/NotificationService');
      await NotificationService.cancelAllQuietReaderNotifications();
    } catch {
      // Native notifications module may be unavailable before rebuild.
    }
    await resetDatabase();
  },
};
