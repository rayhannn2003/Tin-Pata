import { Alert } from 'react-native';

import { getBookDeletionImpact } from '@/utils/bookDeletion';

type TranslateFn = (key: string, params?: Record<string, string | number>) => string;

export function confirmBookDelete(
  bookId: string,
  title: string,
  t: TranslateFn,
  onDelete: () => void | Promise<void>,
): void {
  void (async () => {
    const impact = await getBookDeletionImpact(bookId);
    const hasRelatedData =
      impact.sessionCount > 0 || impact.noteCount > 0 || impact.bookmarkCount > 0;

    const detailMessage = hasRelatedData
      ? t('library.deleteMessageWithData', {
          title,
          sessions: impact.sessionCount,
          notes: impact.noteCount,
          bookmarks: impact.bookmarkCount,
        })
      : t('library.deleteMessage', { title });

    Alert.alert(t('library.deleteTitle'), detailMessage, [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.continue'),
        onPress: () => {
          Alert.alert(t('library.deleteFinalTitle'), t('library.deleteFinalMessage'), [
            { text: t('common.cancel'), style: 'cancel' },
            {
              text: t('common.delete'),
              style: 'destructive',
              onPress: () => {
                void onDelete();
              },
            },
          ]);
        },
      },
    ]);
  })();
}
