export interface NotificationSettings {
  readingReminderEnabled: boolean;
  readingReminderTime: string;
  missedGoalReminderEnabled: boolean;
  missedGoalReminderTime: string;
  rescueReminderEnabled: boolean;
  rescueReminderTime: string;
}

export const NOTIFICATION_SETTING_KEYS = {
  readingReminderEnabled: 'reading_reminder_enabled',
  readingReminderTime: 'reading_reminder_time',
  missedGoalReminderEnabled: 'missed_goal_reminder_enabled',
  missedGoalReminderTime: 'missed_goal_reminder_time',
  rescueReminderEnabled: 'rescue_reminder_enabled',
  rescueReminderTime: 'rescue_reminder_time',
  readingReminderId: 'reading_reminder_notification_id',
  missedGoalReminderId: 'missed_goal_reminder_notification_id',
  rescueReminderId: 'rescue_reminder_notification_id',
  permissionStatus: 'notification_permission_status',
} as const;

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  readingReminderEnabled: false,
  readingReminderTime: '21:00',
  missedGoalReminderEnabled: false,
  missedGoalReminderTime: '22:30',
  rescueReminderEnabled: false,
  rescueReminderTime: '19:00',
};

export type NotificationPermissionStatus = 'granted' | 'denied' | 'undetermined';
