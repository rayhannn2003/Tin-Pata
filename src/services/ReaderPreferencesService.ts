import { SettingsRepository } from '@/db/repositories/SettingsRepository';
import { ReaderStabilityService } from '@/services/ReaderStabilityService';
import {
  DEFAULT_READER_PREFERENCES,
  READER_SETTING_KEYS,
  type ReaderFitMode,
  type ReaderPreferences,
  type ReaderScrollMode,
} from '@/types/reader';

function parseBool(value: string | null, fallback: boolean): boolean {
  if (value === 'true') {
    return true;
  }
  if (value === 'false') {
    return false;
  }
  return fallback;
}

function parseFitMode(value: string | null): ReaderFitMode {
  if (value === 'width' || value === 'page' || value === 'auto') {
    return value;
  }
  return DEFAULT_READER_PREFERENCES.fitMode;
}

function parseScrollMode(value: string | null): ReaderScrollMode {
  if (value === 'vertical' || value === 'horizontal') {
    return value;
  }
  return DEFAULT_READER_PREFERENCES.scrollMode;
}

export function fitModeToPolicy(fitMode: ReaderFitMode): 0 | 1 | 2 {
  switch (fitMode) {
    case 'width':
      return 0;
    case 'page':
      return 1;
    case 'auto':
    default:
      return 2;
  }
}

export function scrollModeToPaging(scrollMode: ReaderScrollMode): boolean {
  return scrollMode === 'horizontal';
}

export const ReaderPreferencesService = {
  /** Fit/scroll/default-focus prefs are stored but not applied while stability mode is `safe`. */
  async getPreferences(): Promise<ReaderPreferences> {
    await ReaderStabilityService.ensureSafeMode();

    const [
      keepAwake,
      fitMode,
      scrollMode,
      showTimer,
      showProgress,
      compactActions,
      defaultFocusMode,
    ] = await Promise.all([
      SettingsRepository.get(READER_SETTING_KEYS.keepAwake),
      SettingsRepository.get(READER_SETTING_KEYS.fitMode),
      SettingsRepository.get(READER_SETTING_KEYS.scrollMode),
      SettingsRepository.get(READER_SETTING_KEYS.showTimer),
      SettingsRepository.get(READER_SETTING_KEYS.showProgress),
      SettingsRepository.get(READER_SETTING_KEYS.compactActions),
      SettingsRepository.get(READER_SETTING_KEYS.defaultFocusMode),
    ]);

    return {
      keepAwake: parseBool(keepAwake, DEFAULT_READER_PREFERENCES.keepAwake),
      fitMode: parseFitMode(fitMode),
      scrollMode: parseScrollMode(scrollMode),
      showTimer: parseBool(showTimer, DEFAULT_READER_PREFERENCES.showTimer),
      showProgress: parseBool(showProgress, DEFAULT_READER_PREFERENCES.showProgress),
      compactActions: parseBool(compactActions, DEFAULT_READER_PREFERENCES.compactActions),
      defaultFocusMode: parseBool(
        defaultFocusMode,
        DEFAULT_READER_PREFERENCES.defaultFocusMode,
      ),
    };
  },

  async savePreferences(preferences: ReaderPreferences): Promise<void> {
    await Promise.all([
      SettingsRepository.set(
        READER_SETTING_KEYS.keepAwake,
        String(preferences.keepAwake),
      ),
      SettingsRepository.set(READER_SETTING_KEYS.fitMode, preferences.fitMode),
      SettingsRepository.set(READER_SETTING_KEYS.scrollMode, preferences.scrollMode),
      SettingsRepository.set(
        READER_SETTING_KEYS.showTimer,
        String(preferences.showTimer),
      ),
      SettingsRepository.set(
        READER_SETTING_KEYS.showProgress,
        String(preferences.showProgress),
      ),
      SettingsRepository.set(
        READER_SETTING_KEYS.compactActions,
        String(preferences.compactActions),
      ),
      SettingsRepository.set(
        READER_SETTING_KEYS.defaultFocusMode,
        String(preferences.defaultFocusMode),
      ),
    ]);
  },

  async updatePreferences(patch: Partial<ReaderPreferences>): Promise<ReaderPreferences> {
    const current = await this.getPreferences();
    const next = { ...current, ...patch };
    await this.savePreferences(next);
    return next;
  },
};
