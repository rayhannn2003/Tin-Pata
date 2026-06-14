import { Platform } from 'react-native';

import {
  NotificationNativeError,
  NOTIFICATION_REBUILD_MESSAGE,
} from '@/services/notifications/NotificationNativeError';

export type NotificationsApi = {
  setNotificationHandler: typeof import('expo-notifications/build/NotificationsHandler').setNotificationHandler;
  getPermissionsAsync: typeof import('expo-notifications/build/NotificationPermissions').getPermissionsAsync;
  requestPermissionsAsync: typeof import('expo-notifications/build/NotificationPermissions').requestPermissionsAsync;
  scheduleNotificationAsync: typeof import('expo-notifications/build/scheduleNotificationAsync').default;
  cancelScheduledNotificationAsync: typeof import('expo-notifications/build/cancelScheduledNotificationAsync').default;
  setNotificationChannelAsync: typeof import('expo-notifications/build/setNotificationChannelAsync').default;
  SchedulableTriggerInputTypes: typeof import('expo-notifications/build/Notifications.types').SchedulableTriggerInputTypes;
  AndroidImportance: typeof import('expo-notifications/build/NotificationChannelManager.types').AndroidImportance;
};

function defaultExport<T>(mod: { default?: T } & Record<string, unknown>, name: string): T {
  const value = mod.default ?? mod[name];
  if (typeof value !== 'function') {
    throw new NotificationNativeError(NOTIFICATION_REBUILD_MESSAGE);
  }
  return value as T;
}

function requireNamedExport<T>(mod: Record<string, unknown>, name: string): T {
  const value = mod[name];
  if (typeof value !== 'function' && typeof value !== 'object') {
    throw new NotificationNativeError(NOTIFICATION_REBUILD_MESSAGE);
  }
  return value as T;
}

/**
 * Loads only local-notification APIs, avoiding the expo-notifications barrel
 * which pulls in push-token code and expo-application.
 */
export async function loadNotificationsApi(): Promise<NotificationsApi> {
  if (Platform.OS === 'web') {
    throw new NotificationNativeError('Notifications are not available on web preview.');
  }

  try {
    const [
      handlerMod,
      permissionsMod,
      scheduleMod,
      cancelMod,
      channelMod,
      typesMod,
      channelTypesMod,
    ] = await Promise.all([
      import('expo-notifications/build/NotificationsHandler'),
      import('expo-notifications/build/NotificationPermissions'),
      import('expo-notifications/build/scheduleNotificationAsync'),
      import('expo-notifications/build/cancelScheduledNotificationAsync'),
      import('expo-notifications/build/setNotificationChannelAsync'),
      import('expo-notifications/build/Notifications.types'),
      import('expo-notifications/build/NotificationChannelManager.types'),
    ]);

    const setNotificationHandler = requireNamedExport<
      NotificationsApi['setNotificationHandler']
    >(handlerMod, 'setNotificationHandler');
    const getPermissionsAsync = requireNamedExport<NotificationsApi['getPermissionsAsync']>(
      permissionsMod,
      'getPermissionsAsync',
    );
    const requestPermissionsAsync = requireNamedExport<
      NotificationsApi['requestPermissionsAsync']
    >(permissionsMod, 'requestPermissionsAsync');

    return {
      setNotificationHandler,
      getPermissionsAsync,
      requestPermissionsAsync,
      scheduleNotificationAsync: defaultExport(scheduleMod, 'scheduleNotificationAsync'),
      cancelScheduledNotificationAsync: defaultExport(
        cancelMod,
        'cancelScheduledNotificationAsync',
      ),
      setNotificationChannelAsync: defaultExport(channelMod, 'setNotificationChannelAsync'),
      SchedulableTriggerInputTypes: requireNamedExport(
        typesMod,
        'SchedulableTriggerInputTypes',
      ),
      AndroidImportance: requireNamedExport(channelTypesMod, 'AndroidImportance'),
    };
  } catch (err) {
    if (err instanceof NotificationNativeError) {
      throw err;
    }
    throw new NotificationNativeError(NOTIFICATION_REBUILD_MESSAGE);
  }
}
