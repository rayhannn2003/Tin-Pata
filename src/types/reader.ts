export const READER_SETTING_KEYS = {
  keepAwake: 'reader_keep_awake',
  fitMode: 'reader_fit_mode',
  scrollMode: 'reader_scroll_mode',
  showTimer: 'reader_show_timer',
  showProgress: 'reader_show_progress',
  compactActions: 'reader_compact_actions',
  defaultFocusMode: 'reader_default_focus_mode',
} as const;

export const LAST_BACKUP_AT_KEY = 'last_backup_at';

export type ReaderFitMode = 'width' | 'page' | 'auto';
export type ReaderScrollMode = 'vertical' | 'horizontal';

export interface ReaderPreferences {
  keepAwake: boolean;
  fitMode: ReaderFitMode;
  scrollMode: ReaderScrollMode;
  showTimer: boolean;
  showProgress: boolean;
  compactActions: boolean;
  defaultFocusMode: boolean;
}

export const DEFAULT_READER_PREFERENCES: ReaderPreferences = {
  keepAwake: true,
  fitMode: 'auto',
  scrollMode: 'vertical',
  showTimer: true,
  showProgress: true,
  compactActions: false,
  defaultFocusMode: false,
};

/** v1.1.1: PDF layout uses these stable values regardless of stored fit/scroll prefs. */
export const STABLE_READER_PDF_BEHAVIOR = {
  fitMode: 'auto' as ReaderFitMode,
  scrollMode: 'vertical' as ReaderScrollMode,
  enablePaging: false,
  fitPolicy: 2 as const,
};

export const PORTABLE_READER_SETTING_KEYS: string[] = [
  READER_SETTING_KEYS.keepAwake,
  READER_SETTING_KEYS.fitMode,
  READER_SETTING_KEYS.scrollMode,
  READER_SETTING_KEYS.showTimer,
  READER_SETTING_KEYS.showProgress,
  READER_SETTING_KEYS.compactActions,
  READER_SETTING_KEYS.defaultFocusMode,
];
