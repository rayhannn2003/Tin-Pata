export type ReaderZoomMode = 'custom' | 'fit-width' | 'fit-page';

export interface ReaderPreferences {
  zoomMode: ReaderZoomMode;
  /** Used when zoomMode === 'custom' */
  zoomScale: number;
  leftSidebarOpen: boolean;
  rightSidebarOpen: boolean;
  theme: 'light' | 'dark' | 'system';
}

export const DEFAULT_READER_PREFERENCES: ReaderPreferences = {
  zoomMode: 'fit-width',
  zoomScale: 1,
  leftSidebarOpen: true,
  rightSidebarOpen: true,
  theme: 'system',
};

export const READER_SETTING_KEYS = {
  zoomMode: 'web_reader_zoom_mode',
  zoomScale: 'web_reader_zoom_scale',
  leftSidebar: 'web_reader_left_sidebar',
  rightSidebar: 'web_reader_right_sidebar',
  theme: 'theme_preference',
} as const;

export type ReaderLoadErrorKind =
  | 'unavailable'
  | 'network'
  | 'corrupt'
  | 'permission'
  | 'unknown';

export interface ReaderLoadError {
  kind: ReaderLoadErrorKind;
  message: string;
}
