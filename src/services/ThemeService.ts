import { SettingsRepository } from '@/db/repositories/SettingsRepository';
import {
  DEFAULT_THEME_PREFERENCE,
  THEME_PREFERENCE_KEY,
  type ThemePreference,
} from '@/types/theme';

export const ThemeService = {
  async getPreference(): Promise<ThemePreference> {
    const value = await SettingsRepository.get(THEME_PREFERENCE_KEY);
    if (value === 'light' || value === 'dark' || value === 'system') {
      return value;
    }
    return DEFAULT_THEME_PREFERENCE;
  },

  async setPreference(preference: ThemePreference): Promise<void> {
    if (!['system', 'light', 'dark'].includes(preference)) {
      throw new Error('Invalid theme preference.');
    }
    await SettingsRepository.set(THEME_PREFERENCE_KEY, preference);
  },
};
