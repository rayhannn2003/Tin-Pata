import { SettingsRepository } from '@/db/repositories/SettingsRepository';
import {
  APP_LANGUAGE_KEY,
  DEFAULT_APP_LANGUAGE,
  type AppLanguage,
} from '@/types/language';

export const LanguageService = {
  isValidLanguage(value: string | null | undefined): value is AppLanguage {
    return value === 'en' || value === 'bn';
  },

  async ensureDefaultLanguage(): Promise<AppLanguage> {
    const stored = await SettingsRepository.get(APP_LANGUAGE_KEY);
    if (this.isValidLanguage(stored)) {
      return stored;
    }
    await SettingsRepository.set(APP_LANGUAGE_KEY, DEFAULT_APP_LANGUAGE);
    return DEFAULT_APP_LANGUAGE;
  },

  async getLanguage(): Promise<AppLanguage> {
    const stored = await SettingsRepository.get(APP_LANGUAGE_KEY);
    if (this.isValidLanguage(stored)) {
      return stored;
    }
    return DEFAULT_APP_LANGUAGE;
  },

  async setLanguage(language: AppLanguage): Promise<void> {
    await SettingsRepository.set(APP_LANGUAGE_KEY, language);
  },
};
