import { translations, type TranslationTree } from '@/i18n/translations';
import { DEFAULT_APP_LANGUAGE, type AppLanguage } from '@/types/language';
import type { Book } from '@/types';

export type TranslationParams = Record<string, string | number>;

function resolvePath(tree: TranslationTree, key: string): string | undefined {
  const parts = key.split('.');
  let current: unknown = tree;
  for (const part of parts) {
    if (current == null || typeof current !== 'object') {
      return undefined;
    }
    current = (current as Record<string, unknown>)[part];
  }
  return typeof current === 'string' ? current : undefined;
}

function interpolate(template: string, params?: TranslationParams): string {
  if (!params) {
    return template;
  }
  return template.replace(/\{\{(\w+)\}\}/g, (_, name: string) => {
    const value = params[name];
    return value === undefined ? `{{${name}}}` : String(value);
  });
}

export function translate(
  key: string,
  language: AppLanguage = DEFAULT_APP_LANGUAGE,
  params?: TranslationParams,
): string {
  const primary = resolvePath(translations[language], key);
  if (primary) {
    return interpolate(primary, params);
  }

  if (language !== DEFAULT_APP_LANGUAGE) {
    const fallback = resolvePath(translations[DEFAULT_APP_LANGUAGE], key);
    if (fallback) {
      return interpolate(fallback, params);
    }
  }

  return key;
}

export function getNotificationMessages(language: AppLanguage, book?: Book | null) {
  const dailyBody = book
    ? translate('notifications.continueBook', language, {
        title: book.title,
        page: book.currentPage,
      })
    : translate('notifications.onePage', language);

  return {
    channelName: translate('notifications.channelName', language),
    dailyReading: {
      title: translate('notifications.dailyTitle', language),
      body: dailyBody,
    },
    missedGoal: {
      title: translate('notifications.missedTitle', language),
      body: book
        ? translate('notifications.continueBook', language, {
            title: book.title,
            page: book.currentPage,
          })
        : translate('notifications.reminder', language),
    },
    rescue: {
      title: translate('notifications.rescueTitle', language),
      body: translate('notifications.rescue', language),
    },
    test: {
      title: translate('notifications.testTitle', language),
      body: book
        ? translate('notifications.continueBook', language, {
            title: book.title,
            page: book.currentPage,
          })
        : translate('notifications.testBody', language),
    },
  };
}
