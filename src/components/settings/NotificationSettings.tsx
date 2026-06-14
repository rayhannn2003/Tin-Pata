import { Alert, Pressable, StyleSheet, Switch, TextInput, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ThemedText } from '@/components/ui/ThemedText';
import { useNotificationSettings } from '@/features/notifications/useNotificationSettings';
import { useTranslation } from '@/i18n/useTranslation';
import { Radius, Spacing } from '@/constants/layout';
import { useThemeColors } from '@/hooks/useColorScheme';
import type { NotificationSettings } from '@/types/notification';

function ReminderRow({
  label,
  description,
  enabled,
  time,
  onToggle,
  onTimeChange,
  disabled,
}: {
  label: string;
  description: string;
  enabled: boolean;
  time: string;
  onToggle: (value: boolean) => void;
  onTimeChange: (value: string) => void;
  disabled?: boolean;
}) {
  const colors = useThemeColors();

  return (
    <View style={[styles.row, { borderColor: colors.border }]}>
      <View style={styles.rowHeader}>
        <View style={styles.rowText}>
          <ThemedText style={styles.rowLabel}>{label}</ThemedText>
          <ThemedText variant="caption" secondary>
            {description}
          </ThemedText>
        </View>
        <Switch
          value={enabled}
          onValueChange={onToggle}
          disabled={disabled}
          trackColor={{ false: colors.border, true: colors.tintMuted }}
          thumbColor={enabled ? colors.tint : colors.surface}
        />
      </View>
      {enabled ? (
        <TextInput
          value={time}
          onChangeText={onTimeChange}
          placeholder="21:00"
          placeholderTextColor={colors.textSecondary}
          keyboardType="numbers-and-punctuation"
          style={[
            styles.timeInput,
            {
              color: colors.text,
              borderColor: colors.border,
              backgroundColor: colors.background,
            },
          ]}
        />
      ) : null}
    </View>
  );
}

export function NotificationSettingsPanel() {
  const colors = useThemeColors();
  const { t } = useTranslation();
  const {
    settings,
    permission,
    loading,
    saving,
    error,
    success,
    setSettings,
    saveSettings,
    sendTest,
  } = useNotificationSettings();

  const update = (patch: Partial<NotificationSettings>) => {
    setSettings((prev) => ({ ...prev, ...patch }));
  };

  const handleSave = () => {
    void saveSettings(settings).catch(() => {
      // Error state handled in hook.
    });
  };

  const handleShowScheduled = () => {
    void (async () => {
      try {
        const { NotificationService } = await import('@/services/NotificationService');
        const count = await NotificationService.getScheduledRemindersCount();
        Alert.alert(
          t('notifications.showScheduled'),
          t('notifications.scheduledCount', { count }),
        );
      } catch {
        Alert.alert(t('notifications.showScheduled'), t('notifications.scheduledCount', { count: 0 }));
      }
    })();
  };

  const permissionLabel =
    permission === 'granted'
      ? t('notifications.permissionAllowed')
      : permission === 'denied'
        ? t('notifications.permissionBlocked')
        : t('notifications.permissionNotAsked');

  return (
    <Card style={styles.card}>
      <ThemedText variant="caption" secondary>
        {t('notifications.deviceOnly')}
      </ThemedText>

      <ThemedText variant="caption" secondary>
        {t('notifications.devBuildNote')}
      </ThemedText>

      <ThemedText variant="caption" secondary>
        {t('notifications.permissionLabel', { status: permissionLabel })}
      </ThemedText>

      <ReminderRow
        label={t('notifications.dailyReminder')}
        description={t('notifications.dailyReminderDesc')}
        enabled={settings.readingReminderEnabled}
        time={settings.readingReminderTime}
        onToggle={(value) => update({ readingReminderEnabled: value })}
        onTimeChange={(value) => update({ readingReminderTime: value })}
        disabled={loading || saving}
      />

      <ReminderRow
        label={t('notifications.missedGoal')}
        description={t('notifications.missedGoalDesc')}
        enabled={settings.missedGoalReminderEnabled}
        time={settings.missedGoalReminderTime}
        onToggle={(value) => update({ missedGoalReminderEnabled: value })}
        onTimeChange={(value) => update({ missedGoalReminderTime: value })}
        disabled={loading || saving}
      />

      <ReminderRow
        label={t('notifications.rescueReminder')}
        description={t('notifications.rescueReminderDesc')}
        enabled={settings.rescueReminderEnabled}
        time={settings.rescueReminderTime}
        onToggle={(value) => update({ rescueReminderEnabled: value })}
        onTimeChange={(value) => update({ rescueReminderTime: value })}
        disabled={loading || saving}
      />

      {error ? (
        <ThemedText variant="caption" style={{ color: colors.danger }}>
          {error}
        </ThemedText>
      ) : null}

      {success ? (
        <ThemedText variant="caption" style={{ color: colors.tint }}>
          {success}
        </ThemedText>
      ) : null}

      <View style={styles.actions}>
        <Button
          label={saving ? t('notifications.saving') : t('notifications.saveReminders')}
          onPress={handleSave}
          disabled={loading || saving}
        />
        <Pressable onPress={() => void sendTest()} disabled={loading || saving}>
          <ThemedText variant="caption" style={{ color: colors.tint }}>
            {t('notifications.sendTest')}
          </ThemedText>
        </Pressable>
        <Pressable onPress={handleShowScheduled} disabled={loading || saving}>
          <ThemedText variant="caption" style={{ color: colors.tint }}>
            {t('notifications.showScheduled')}
          </ThemedText>
        </Pressable>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: Spacing.md },
  row: {
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  rowText: { flex: 1, gap: 2 },
  rowLabel: { fontWeight: '600', fontSize: 15 },
  timeInput: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: 16,
    maxWidth: 120,
  },
  actions: { gap: Spacing.sm },
});
