export class NotificationNativeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotificationNativeError';
  }
}

export const NOTIFICATION_REBUILD_MESSAGE =
  'Notifications require a rebuilt dev build. Run: npx expo run:android';
