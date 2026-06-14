export const READER_SETTING_KEYS = {
  keepAwake: 'reader_keep_awake',
  fitMode: 'reader_fit_mode',
  scrollMode: 'reader_scroll_mode',
  showTimer: 'reader_show_timer',
  showProgress: 'reader_show_progress',
  compactActions: 'reader_compact_actions',
  defaultFocusMode: 'reader_default_focus_mode',
  stabilityMode: 'reader_stability_mode',
  brightnessEnabled: 'reader_brightness_enabled',
  brightnessValue: 'reader_brightness_value',
} as const;

export const LAST_BACKUP_AT_KEY = 'last_backup_at';

export type ReaderFitMode = 'width' | 'page' | 'auto';
export type ReaderScrollMode = 'vertical' | 'horizontal';

/** react-native-pdf fitPolicy: 0 = width, 1 = height (page), 2 = both (auto). */
export type PdfFitPolicy = 0 | 1 | 2;

export function fitModeToFitPolicy(fitMode: ReaderFitMode): PdfFitPolicy {
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

export const READER_FIT_MODES: ReaderFitMode[] = ['auto', 'width', 'page'];
export const READER_SCROLL_MODES: ReaderScrollMode[] = ['vertical', 'horizontal'];

/** Maps scroll mode to react-native-pdf `enablePaging` at reader open only. */
export function scrollModeToEnablePaging(scrollMode: ReaderScrollMode): boolean {
  return scrollMode === 'horizontal';
}

/** v1.1.4A: only `safe` is supported; future modes must opt in explicitly. */
export type ReaderStabilityMode = 'safe';

export const DEFAULT_READER_STABILITY_MODE: ReaderStabilityMode = 'safe';

export interface ReaderPreferences {
  keepAwake: boolean;
  fitMode: ReaderFitMode;
  scrollMode: ReaderScrollMode;
  showTimer: boolean;
  showProgress: boolean;
  compactActions: boolean;
  defaultFocusMode: boolean;
  brightnessEnabled: boolean;
  brightnessValue: number;
}

export const DEFAULT_READER_PREFERENCES: ReaderPreferences = {
  keepAwake: true,
  fitMode: 'auto',
  scrollMode: 'vertical',
  showTimer: true,
  showProgress: true,
  compactActions: false,
  defaultFocusMode: false,
  brightnessEnabled: false,
  brightnessValue: 0.75,
};

/** Default PDF behavior when prefs are unavailable. Fit/scroll are session-frozen at reader open. */
export const STABLE_READER_PDF_BEHAVIOR = {
  fitMode: 'auto' as ReaderFitMode,
  scrollMode: 'vertical' as ReaderScrollMode,
  enablePaging: false,
  fitPolicy: fitModeToFitPolicy('auto'),
};

export const PORTABLE_READER_SETTING_KEYS: string[] = [
  READER_SETTING_KEYS.keepAwake,
  READER_SETTING_KEYS.fitMode,
  READER_SETTING_KEYS.scrollMode,
  READER_SETTING_KEYS.showTimer,
  READER_SETTING_KEYS.showProgress,
  READER_SETTING_KEYS.compactActions,
  READER_SETTING_KEYS.defaultFocusMode,
  READER_SETTING_KEYS.stabilityMode,
  READER_SETTING_KEYS.brightnessEnabled,
  READER_SETTING_KEYS.brightnessValue,
];
