export type AppLanguage = 'en' | 'bn';

export const APP_LANGUAGE_KEY = 'app_language';
export const DEFAULT_APP_LANGUAGE: AppLanguage = 'en';

export const SUPPORTED_LANGUAGES: { code: AppLanguage; label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'bn', label: 'বাংলা' },
];
