import { useI18nContext } from '@/i18n/I18nProvider';
import type { AppLanguage } from '@/types/language';

export function useLanguagePreference() {
  const { language, setLanguage, loading } = useI18nContext();
  return {
    language,
    setLanguage: async (next: AppLanguage) => {
      await setLanguage(next);
    },
    loading,
  };
}
