import { useI18nContext } from '@/i18n/I18nProvider';
import type { TranslationParams } from '@/i18n/translate';

export function useTranslation() {
  const { t, language, loading, setLanguage } = useI18nContext();
  return {
    t: (key: string, params?: TranslationParams) => t(key, params),
    language,
    loading,
    setLanguage,
  };
}
