import { useCallback, useState } from 'react';
import { Platform } from 'react-native';
import { useFocusEffect } from 'expo-router';

import { useTranslation } from '@/i18n/useTranslation';
import { NotificationSettingsStorage } from '@/services/NotificationSettingsStorage';
import { NOTIFICATION_REBUILD_MESSAGE } from '@/services/notifications/NotificationNativeError';
import {
  DEFAULT_NOTIFICATION_SETTINGS,
  type NotificationPermissionStatus,
  type NotificationSettings,
} from '@/types/notification';

const REBUILD_MESSAGE = NOTIFICATION_REBUILD_MESSAGE;

async function loadNativeNotificationService() {
  if (Platform.OS === 'web') {
    return null;
  }
  try {
    const module = await import('@/services/NotificationService');
    return module.NotificationService;
  } catch (err) {
    if (err instanceof Error && err.message.includes('rebuilt dev build')) {
      throw err;
    }
    return null;
  }
}

export function useNotificationSettings() {
  const { t } = useTranslation();
  const [settings, setSettings] = useState<NotificationSettings>(DEFAULT_NOTIFICATION_SETTINGS);
  const [permission, setPermission] = useState<NotificationPermissionStatus>('undetermined');
  const [nativeReady, setNativeReady] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (Platform.OS === 'web') {
      setSettings(DEFAULT_NOTIFICATION_SETTINGS);
      setPermission('denied');
      setNativeReady(false);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const stored = await NotificationSettingsStorage.getSettings();
      setSettings(stored);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load notification settings.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  const ensureNative = useCallback(async () => {
    if (Platform.OS === 'web') {
      setError('Notifications are not available on web preview.');
      return null;
    }
    if (nativeReady === false) {
      setError(REBUILD_MESSAGE);
      return null;
    }
    try {
      const service = await loadNativeNotificationService();
      if (!service) {
        setNativeReady(false);
        setError(REBUILD_MESSAGE);
        return null;
      }
      setNativeReady(true);
      return service;
    } catch (err) {
      setNativeReady(false);
      setError(err instanceof Error ? err.message : REBUILD_MESSAGE);
      return null;
    }
  }, [nativeReady]);

  const ensurePermission = useCallback(async (): Promise<boolean> => {
    try {
      const service = await ensureNative();
      if (!service) {
        return false;
      }
      const current = await service.getPermissionStatus();
      if (current === 'granted') {
        setPermission('granted');
        return true;
      }
      const requested = await service.requestPermission();
      setPermission(requested);
      return requested === 'granted';
    } catch (err) {
      setError(err instanceof Error ? err.message : REBUILD_MESSAGE);
      return false;
    }
  }, [ensureNative]);

  const saveSettings = useCallback(
    async (next: NotificationSettings) => {
      if (Platform.OS === 'web') {
        setError('Notifications are not available on web preview.');
        return;
      }

      for (const time of [
        next.readingReminderTime,
        next.missedGoalReminderTime,
        next.rescueReminderTime,
      ]) {
        if (!NotificationSettingsStorage.validateTime(time)) {
          setError(t('notifications.invalidTime'));
          throw new Error('Invalid time');
        }
      }

      const normalized: NotificationSettings = {
        ...next,
        readingReminderTime: NotificationSettingsStorage.normalizeTime(next.readingReminderTime),
        missedGoalReminderTime: NotificationSettingsStorage.normalizeTime(
          next.missedGoalReminderTime,
        ),
        rescueReminderTime: NotificationSettingsStorage.normalizeTime(next.rescueReminderTime),
      };

      const needsNative =
        normalized.readingReminderEnabled ||
        normalized.missedGoalReminderEnabled ||
        normalized.rescueReminderEnabled;

      try {
        setSaving(true);
        setError(null);
        setSuccess(null);

        await NotificationSettingsStorage.saveSettings(normalized);
        setSettings(normalized);

        if (!needsNative) {
          const service = await ensureNative();
          if (service) {
            await service.cancelAllQuietReaderNotifications();
          }
          setSuccess(t('notifications.saved'));
          return;
        }

        const allowed = await ensurePermission();
        if (!allowed) {
          setError((current) => current ?? t('notifications.permissionRequired'));
          throw new Error('Permission denied');
        }

        const service = await ensureNative();
        if (!service) {
          throw new Error(REBUILD_MESSAGE);
        }
        await service.rescheduleAllFromSettings();
        setSuccess(t('notifications.saved'));
      } catch (err) {
        if (
          err instanceof Error &&
          err.message !== 'Permission denied' &&
          err.message !== 'Invalid time'
        ) {
          setError(err.message);
        }
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [ensureNative, ensurePermission, t],
  );

  const sendTest = useCallback(async () => {
    try {
      setError(null);
      setSuccess(null);
      const allowed = await ensurePermission();
      if (!allowed) {
        setError(t('notifications.permissionRequired'));
        return;
      }
      const service = await ensureNative();
      if (!service) {
        return;
      }
      await service.sendTestNotification();
      setSuccess(t('notifications.testSuccess'));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send test notification.');
    }
  }, [ensureNative, ensurePermission, t]);

  return {
    settings,
    permission,
    nativeReady,
    loading,
    saving,
    error,
    success,
    setSettings,
    saveSettings,
    sendTest,
    refresh,
    clearError: () => setError(null),
    clearSuccess: () => setSuccess(null),
  };
}
