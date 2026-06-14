import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ThemedText } from '@/components/ui/ThemedText';
import { useTranslation } from '@/i18n/useTranslation';
import { GoalService, GoalError } from '@/services/GoalService';
import type { DailyGoal, GoalType } from '@/types';
import { formatGoalTitle } from '@/utils/format';
import { useThemeColors } from '@/hooks/useColorScheme';

interface GoalEditorProps {
  goal: DailyGoal | null;
  onSaved: () => void;
}

export function GoalEditor({ goal, onSaved }: GoalEditorProps) {
  const colors = useThemeColors();
  const { t } = useTranslation();
  const [goalType, setGoalType] = useState<GoalType>(goal?.goalType ?? 'pages');
  const [targetInput, setTargetInput] = useState(String(goal?.targetValue ?? 5));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const goalTypes = useMemo(
    (): { key: GoalType; label: string }[] => [
      { key: 'pages', label: t('goal.pages') },
      { key: 'minutes', label: t('goal.minutes') },
      { key: 'sessions', label: t('goal.sessions') },
    ],
    [t],
  );

  useEffect(() => {
    if (goal) {
      setGoalType(goal.goalType);
      setTargetInput(String(goal.targetValue));
    }
  }, [goal]);

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      const parsed = Number(targetInput.trim());
      await GoalService.updateActiveGoal(goalType, parsed);
      onSaved();
    } catch (err) {
      setError(err instanceof GoalError ? err.message : t('goal.saveError'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card style={styles.card}>
      {goal ? (
        <ThemedText variant="caption" secondary>
          {t('goal.current', { label: formatGoalTitle(goal.goalType, goal.targetValue) })}
        </ThemedText>
      ) : null}

      <ThemedText variant="label" secondary>
        {t('goal.goalType')}
      </ThemedText>
      <View style={styles.chipRow}>
        {goalTypes.map(({ key, label }) => {
          const active = goalType === key;
          return (
            <Pressable
              key={key}
              onPress={() => setGoalType(key)}
              style={[
                styles.chip,
                {
                  backgroundColor: active ? colors.tintMuted : colors.background,
                  borderColor: active ? colors.tint : colors.border,
                },
              ]}
            >
              <ThemedText
                variant="caption"
                style={{ color: active ? colors.tint : colors.textSecondary }}
              >
                {label}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>

      <ThemedText variant="label" secondary>
        {t('goal.dailyTarget')}
      </ThemedText>
      <TextInput
        value={targetInput}
        onChangeText={setTargetInput}
        keyboardType="number-pad"
        placeholder={t('goal.targetPlaceholder')}
        placeholderTextColor={colors.textSecondary}
        style={[
          styles.input,
          {
            color: colors.text,
            borderColor: error ? colors.danger : colors.border,
            backgroundColor: colors.background,
          },
        ]}
      />

      {error ? (
        <ThemedText variant="caption" style={{ color: colors.danger }}>
          {error}
        </ThemedText>
      ) : null}

      <Button
        label={saving ? t('notifications.saving') : t('goal.saveGoal')}
        onPress={() => void handleSave()}
        disabled={saving}
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: 12 },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
  },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
});
