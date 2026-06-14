import { SettingsRepository } from '@/db/repositories/SettingsRepository';
import {
  DEFAULT_NOTIFICATION_SETTINGS,
  NOTIFICATION_SETTING_KEYS,
  type NotificationSettings,
} from '@/types/notification';

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

export const NotificationSettingsStorage = {
  async getSettings(): Promise<NotificationSettings> {
    const [
      readingReminderEnabled,
      readingReminderTime,
      missedGoalReminderEnabled,
      missedGoalReminderTime,
      rescueReminderEnabled,
      rescueReminderTime,
    ] = await Promise.all([
      SettingsRepository.get(NOTIFICATION_SETTING_KEYS.readingReminderEnabled),
      SettingsRepository.get(NOTIFICATION_SETTING_KEYS.readingReminderTime),
      SettingsRepository.get(NOTIFICATION_SETTING_KEYS.missedGoalReminderEnabled),
      SettingsRepository.get(NOTIFICATION_SETTING_KEYS.missedGoalReminderTime),
      SettingsRepository.get(NOTIFICATION_SETTING_KEYS.rescueReminderEnabled),
      SettingsRepository.get(NOTIFICATION_SETTING_KEYS.rescueReminderTime),
    ]);

    return {
      readingReminderEnabled: readingReminderEnabled === 'true',
      readingReminderTime: readingReminderTime ?? DEFAULT_NOTIFICATION_SETTINGS.readingReminderTime,
      missedGoalReminderEnabled: missedGoalReminderEnabled === 'true',
      missedGoalReminderTime:
        missedGoalReminderTime ?? DEFAULT_NOTIFICATION_SETTINGS.missedGoalReminderTime,
      rescueReminderEnabled: rescueReminderEnabled === 'true',
      rescueReminderTime: rescueReminderTime ?? DEFAULT_NOTIFICATION_SETTINGS.rescueReminderTime,
    };
  },

  async saveSettings(settings: NotificationSettings): Promise<void> {
    await Promise.all([
      SettingsRepository.set(
        NOTIFICATION_SETTING_KEYS.readingReminderEnabled,
        settings.readingReminderEnabled ? 'true' : 'false',
      ),
      SettingsRepository.set(
        NOTIFICATION_SETTING_KEYS.readingReminderTime,
        settings.readingReminderTime,
      ),
      SettingsRepository.set(
        NOTIFICATION_SETTING_KEYS.missedGoalReminderEnabled,
        settings.missedGoalReminderEnabled ? 'true' : 'false',
      ),
      SettingsRepository.set(
        NOTIFICATION_SETTING_KEYS.missedGoalReminderTime,
        settings.missedGoalReminderTime,
      ),
      SettingsRepository.set(
        NOTIFICATION_SETTING_KEYS.rescueReminderEnabled,
        settings.rescueReminderEnabled ? 'true' : 'false',
      ),
      SettingsRepository.set(
        NOTIFICATION_SETTING_KEYS.rescueReminderTime,
        settings.rescueReminderTime,
      ),
    ]);
  },

  validateTime(time: string): boolean {
    return /^([01]?\d|2[0-3]):[0-5]\d$/.test(time.trim());
  },

  normalizeTime(time: string): string {
    const { hour, minute } = parseTime(time);
    return formatTimeInput(hour, minute);
  },
};
