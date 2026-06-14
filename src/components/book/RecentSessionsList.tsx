import { Pressable, StyleSheet, View } from 'react-native';

import { Card } from '@/components/ui/Card';
import { ThemedText } from '@/components/ui/ThemedText';
import { useTranslation } from '@/i18n/useTranslation';
import { Spacing } from '@/constants/layout';
import { useThemeColors } from '@/hooks/useColorScheme';
import type { ReadingSession } from '@/types';
import { formatImportDate } from '@/utils/format';
import { formatReadingDuration } from '@/utils/date';

interface RecentSessionsListProps {
  sessions: ReadingSession[];
}

export function RecentSessionsList({ sessions }: RecentSessionsListProps) {
  const { t } = useTranslation();
  const colors = useThemeColors();

  if (sessions.length === 0) {
    return (
      <Card muted>
        <ThemedText variant="caption" secondary>
          {t('bookDetail.noSessions')}
        </ThemedText>
      </Card>
    );
  }

  return (
    <Card style={styles.card}>
      <ThemedText variant="subtitle">{t('bookDetail.recentSessions')}</ThemedText>
      {sessions.map((session) => (
        <View key={session.id} style={[styles.row, { borderColor: colors.border }]}>
          <ThemedText variant="caption" secondary>
            {formatImportDate(session.createdAt)}
          </ThemedText>
          <ThemedText variant="caption">
            {formatReadingDuration(session.durationSeconds)}
            {' · '}
            {t('bookDetail.sessionPages', { count: session.pagesRead })}
          </ThemedText>
          <ThemedText variant="caption" secondary>
            {t('bookDetail.sessionRange', {
              start: session.startPage,
              end: session.endPage,
            })}
          </ThemedText>
        </View>
      ))}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: Spacing.sm },
  row: {
    gap: 2,
    paddingVertical: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});
