import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { translate, type TranslationParams } from '@/i18n/translate';
import { LanguageService } from '@/services/LanguageService';
import { DEFAULT_APP_LANGUAGE, type AppLanguage } from '@/types/language';

interface I18nContextValue {
  language: AppLanguage;
  loading: boolean;
  setLanguage: (language: AppLanguage) => Promise<void>;
  t: (key: string, params?: TranslationParams) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

async function rescheduleNotificationsIfNeeded(): Promise<void> {
  try {
    const { NotificationService } = await import('@/services/NotificationService');
    await NotificationService.rescheduleAllFromSettings();
  } catch {
    // Native notifications may be unavailable.
  }
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<AppLanguage>(DEFAULT_APP_LANGUAGE);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const stored = await LanguageService.ensureDefaultLanguage();
      setLanguageState(stored);
    } catch {
      setLanguageState(DEFAULT_APP_LANGUAGE);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const setLanguage = useCallback(async (next: AppLanguage) => {
    await LanguageService.setLanguage(next);
    setLanguageState(next);
    await rescheduleNotificationsIfNeeded();
  }, []);

  const t = useCallback(
    (key: string, params?: TranslationParams) => translate(key, language, params),
    [language],
  );

  const value = useMemo(
    () => ({ language, loading, setLanguage, t }),
    [language, loading, setLanguage, t],
  );

  if (loading) {
    return null;
  }

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18nContext(): I18nContextValue {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18nContext must be used within I18nProvider');
  }
  return context;
}
