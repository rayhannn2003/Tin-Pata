import { Platform } from 'react-native';

import { getNotificationMessages } from '@/i18n/translate';
import { BookRepository } from '@/db/repositories/BookRepository';
import { SettingsRepository } from '@/db/repositories/SettingsRepository';
import { GoalService } from '@/services/GoalService';
import { LanguageService } from '@/services/LanguageService';
import {
  loadNotificationsApi,
  type NotificationsApi,
} from '@/services/notifications/loadNotificationsApi';
import {
  NotificationNativeError,
  NOTIFICATION_REBUILD_MESSAGE,
} from '@/services/notifications/NotificationNativeError';
import {
  NOTIFICATION_SETTING_KEYS,
  type NotificationPermissionStatus,
  type NotificationSettings,
} from '@/types/notification';

export { NotificationNativeError, NOTIFICATION_REBUILD_MESSAGE };

const ANDROID_CHANNEL_ID = 'tin-pata-reminders';

async function resolveSchedulingContext() {
  const language = await LanguageService.getLanguage();
  const bookCount = await BookRepository.count();
  const book =
    bookCount > 0
      ? (await BookRepository.getContinueReadingBook()) ??
        (await BookRepository.getLastReadingBook())
      : null;
  const messages = getNotificationMessages(language, book);
  const goalCompleted = await GoalService.isTodayGoalCompleted();
  return { bookCount, messages, goalCompleted };
}

let notificationsApi: NotificationsApi | null = null;
let notificationsUnavailable = false;
let handlerConfigured = false;

async function loadNotifications(): Promise<NotificationsApi | null> {
  if (Platform.OS === 'web' || notificationsUnavailable) {
    return null;
  }
  if (notificationsApi) {
    return notificationsApi;
  }
  try {
    notificationsApi = await loadNotificationsApi();
    return notificationsApi;
  } catch (err) {
    notificationsUnavailable = true;
    if (err instanceof NotificationNativeError) {
      throw err;
    }
    return null;
  }
}

async function requireNotifications(): Promise<NotificationsApi> {
  const api = await loadNotifications();
  if (!api) {
    throw new NotificationNativeError(NOTIFICATION_REBUILD_MESSAGE);
  }
  return api;
}

async function configureHandler(): Promise<void> {
  if (handlerConfigured || Platform.OS === 'web') {
    return;
  }
  const Notifications = await loadNotifications();
  if (!Notifications || typeof Notifications.setNotificationHandler !== 'function') {
    throw new NotificationNativeError(NOTIFICATION_REBUILD_MESSAGE);
  }
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
  handlerConfigured = true;
}

function parseTime(time: string): { hour: number; minute: number } {
  const match = /^(\d{1,2}):(\d{2})$/.exec(time.trim());
  if (!match) {
    return { hour: 21, minute: 0 };
  }
  const hour = Math.min(23, Math.max(0, Number(match[1])));
  const minute = Math.min(59, Math.max(0, Number(match[2])));
  return { hour, minute };
}

function formatTimeInput(hour: number, minute: number): string {
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

async function cancelStoredNotification(idKey: string): Promise<void> {
  if (Platform.OS === 'web') {
    return;
  }
  const Notifications = await loadNotifications();
  if (!Notifications) {
    return;
  }
  const storedId = await SettingsRepository.get(idKey);
  if (!storedId) {
    return;
  }
  try {
    await Notifications.cancelScheduledNotificationAsync(storedId);
  } catch {
    // Notification may already be gone.
  }
  await SettingsRepository.set(idKey, '');
}

export const NotificationService = {
  isNativeAvailable(): boolean {
    return Platform.OS !== 'web' && !notificationsUnavailable;
  },

  async ensureAndroidChannel(): Promise<void> {
    if (Platform.OS !== 'android') {
      return;
    }
    const Notifications = await requireNotifications();
    await configureHandler();
    const { messages } = await resolveSchedulingContext();
    await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
      name: messages.channelName,
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      enableVibrate: true,
      sound: 'default',
    });
  },

  async getPermissionStatus(): Promise<NotificationPermissionStatus> {
    if (Platform.OS === 'web') {
      return 'denied';
    }
    try {
      const Notifications = await requireNotifications();
      await configureHandler();
      const settings = await Notifications.getPermissionsAsync();
      if (settings.granted) {
        return 'granted';
      }
      if (settings.canAskAgain === false) {
        return 'denied';
      }
      return 'undetermined';
    } catch (err) {
      notificationsUnavailable = true;
      if (err instanceof NotificationNativeError) {
        throw err;
      }
      return 'denied';
    }
  },

  async requestPermission(): Promise<NotificationPermissionStatus> {
    if (Platform.OS === 'web') {
      return 'denied';
    }
    try {
      const Notifications = await requireNotifications();
      await configureHandler();
      await this.ensureAndroidChannel();
      const result = await Notifications.requestPermissionsAsync();
      const status: NotificationPermissionStatus = result.granted
        ? 'granted'
        : result.canAskAgain === false
          ? 'denied'
          : 'undetermined';
      await SettingsRepository.set(NOTIFICATION_SETTING_KEYS.permissionStatus, status);
      return status;
    } catch (err) {
      notificationsUnavailable = true;
      if (err instanceof NotificationNativeError) {
        throw err;
      }
      throw new NotificationNativeError(NOTIFICATION_REBUILD_MESSAGE);
    }
  },

  async getSettings(): Promise<NotificationSettings> {
    const { NotificationSettingsStorage } = await import(
      '@/services/NotificationSettingsStorage'
    );
    return NotificationSettingsStorage.getSettings();
  },

  async saveSettings(settings: NotificationSettings): Promise<void> {
    const { NotificationSettingsStorage } = await import(
      '@/services/NotificationSettingsStorage'
    );
    return NotificationSettingsStorage.saveSettings(settings);
  },

  validateTime(time: string): boolean {
    return /^([01]?\d|2[0-3]):[0-5]\d$/.test(time.trim());
  },

  normalizeTime(time: string): string {
    const { hour, minute } = parseTime(time);
    return formatTimeInput(hour, minute);
  },

  async cancelReadingReminder(): Promise<void> {
    await cancelStoredNotification(NOTIFICATION_SETTING_KEYS.readingReminderId);
  },

  async cancelMissedGoalReminder(): Promise<void> {
    await cancelStoredNotification(NOTIFICATION_SETTING_KEYS.missedGoalReminderId);
  },

  async cancelRescueReminder(): Promise<void> {
    await cancelStoredNotification(NOTIFICATION_SETTING_KEYS.rescueReminderId);
  },

  async cancelAllQuietReaderNotifications(): Promise<void> {
    if (Platform.OS === 'web') {
      return;
    }
    await Promise.all([
      this.cancelReadingReminder(),
      this.cancelMissedGoalReminder(),
      this.cancelRescueReminder(),
    ]);
  },

  async scheduleDailyReadingReminder(
    time: string,
    messagesOverride?: ReturnType<typeof getNotificationMessages>,
  ): Promise<void> {
    if (Platform.OS === 'web') {
      return;
    }
    const Notifications = await requireNotifications();
    await configureHandler();
    await this.ensureAndroidChannel();
    await this.cancelReadingReminder();

    const { hour, minute } = parseTime(time);
    const messages = messagesOverride ?? (await resolveSchedulingContext()).messages;
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: messages.dailyReading.title,
        body: messages.dailyReading.body,
        ...(Platform.OS === 'android' ? { channelId: ANDROID_CHANNEL_ID } : {}),
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
      },
    });

    await SettingsRepository.set(NOTIFICATION_SETTING_KEYS.readingReminderId, id);
  },

  async scheduleMissedGoalReminder(
    time: string,
    messagesOverride?: ReturnType<typeof getNotificationMessages>,
  ): Promise<void> {
    if (Platform.OS === 'web') {
      return;
    }
    const Notifications = await requireNotifications();
    await configureHandler();
    await this.ensureAndroidChannel();
    await this.cancelMissedGoalReminder();

    const { hour, minute } = parseTime(time);
    const messages = messagesOverride ?? (await resolveSchedulingContext()).messages;
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: messages.missedGoal.title,
        body: messages.missedGoal.body,
        ...(Platform.OS === 'android' ? { channelId: ANDROID_CHANNEL_ID } : {}),
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
      },
    });

    await SettingsRepository.set(NOTIFICATION_SETTING_KEYS.missedGoalReminderId, id);
  },

  async scheduleRescueReminder(
    time: string,
    messagesOverride?: ReturnType<typeof getNotificationMessages>,
  ): Promise<void> {
    if (Platform.OS === 'web') {
      return;
    }
    const Notifications = await requireNotifications();
    await configureHandler();
    await this.ensureAndroidChannel();
    await this.cancelRescueReminder();

    const { hour, minute } = parseTime(time);
    const messages = messagesOverride ?? (await resolveSchedulingContext()).messages;
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: messages.rescue.title,
        body: messages.rescue.body,
        ...(Platform.OS === 'android' ? { channelId: ANDROID_CHANNEL_ID } : {}),
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
      },
    });

    await SettingsRepository.set(NOTIFICATION_SETTING_KEYS.rescueReminderId, id);
  },

  async sendTestNotification(): Promise<void> {
    if (Platform.OS === 'web') {
      throw new NotificationNativeError('Notifications are not available on web preview.');
    }
    const Notifications = await requireNotifications();
    await configureHandler();
    await this.ensureAndroidChannel();
    const status = await this.getPermissionStatus();
    if (status !== 'granted') {
      throw new NotificationNativeError(
        'Notification permission is required to send a test reminder.',
      );
    }

    const { messages } = await resolveSchedulingContext();
    await Notifications.scheduleNotificationAsync({
      content: {
        title: messages.test.title,
        body: messages.test.body,
        ...(Platform.OS === 'android' ? { channelId: ANDROID_CHANNEL_ID } : {}),
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 2,
      },
    });
  },

  async rescheduleAllFromSettings(): Promise<void> {
    const settings = await this.getSettings();
    const permission = await this.getPermissionStatus();

    if (permission !== 'granted') {
      await this.cancelAllQuietReaderNotifications();
      return;
    }

    const context = await resolveSchedulingContext();

    if (settings.readingReminderEnabled) {
      await this.scheduleDailyReadingReminder(
        settings.readingReminderTime,
        context.messages,
      );
    } else {
      await this.cancelReadingReminder();
    }

    if (settings.missedGoalReminderEnabled) {
      if (context.goalCompleted) {
        await this.cancelMissedGoalReminder();
      } else {
        await this.scheduleMissedGoalReminder(
          settings.missedGoalReminderTime,
          context.messages,
        );
      }
    } else {
      await this.cancelMissedGoalReminder();
    }

    if (settings.rescueReminderEnabled) {
      if (context.bookCount === 0) {
        await this.cancelRescueReminder();
      } else {
        await this.scheduleRescueReminder(settings.rescueReminderTime, context.messages);
      }
    } else {
      await this.cancelRescueReminder();
    }
  },

  async getScheduledRemindersCount(): Promise<number> {
    if (Platform.OS === 'web') {
      return 0;
    }
    try {
      const mod = await import('expo-notifications/build/getAllScheduledNotificationsAsync');
      await requireNotifications();
      const scheduled = await mod.default();
      return scheduled.length;
    } catch {
      return 0;
    }
  },
};
