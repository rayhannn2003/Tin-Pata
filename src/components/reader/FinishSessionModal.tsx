import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

import { Button } from '@/components/ui/Button';
import { ThemedText } from '@/components/ui/ThemedText';
import { useTranslation } from '@/i18n/useTranslation';
import { useThemeColors } from '@/hooks/useColorScheme';
import type {
  SessionBlockerOption,
  SessionFocusOption,
  SessionMoodOption,
} from '@/types/session';
import { formatReadingDuration } from '@/utils/date';

interface FinishSessionModalProps {
  visible: boolean;
  saving: boolean;
  startPage: number;
  endPage: number;
  pagesRead: number;
  durationSeconds: number;
  onClose: () => void;
  onSave: (details: {
    focus: SessionFocusOption | null;
    mood: SessionMoodOption | null;
    blocker: SessionBlockerOption | null;
  }) => void;
}

const FOCUS_OPTIONS: { key: SessionFocusOption; label: string }[] = [
  { key: 'good', label: 'Good' },
  { key: 'medium', label: 'Medium' },
  { key: 'bad', label: 'Bad' },
];

const MOOD_OPTIONS: { key: SessionMoodOption; label: string }[] = [
  { key: 'motivated', label: 'Motivated' },
  { key: 'neutral', label: 'Neutral' },
  { key: 'bored', label: 'Bored' },
  { key: 'sleepy', label: 'Sleepy' },
  { key: 'distracted', label: 'Distracted' },
];

const BLOCKER_OPTIONS: { key: SessionBlockerOption; label: string }[] = [
  { key: 'phone', label: 'Phone' },
  { key: 'sleepy', label: 'Sleepy' },
  { key: 'hard_language', label: 'Hard language' },
  { key: 'boring', label: 'Boring' },
  { key: 'busy', label: 'Busy' },
  { key: 'stress', label: 'Stress' },
  { key: 'other', label: 'Other' },
];

function OptionChip<T extends string>({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  const colors = useThemeColors();
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        {
          backgroundColor: selected ? colors.tintMuted : colors.surface,
          borderColor: selected ? colors.tint : colors.border,
        },
      ]}
    >
      <ThemedText variant="caption" style={{ color: selected ? colors.tint : colors.textSecondary }}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

export function FinishSessionModal({
  visible,
  saving,
  startPage,
  endPage,
  pagesRead,
  durationSeconds,
  onClose,
  onSave,
}: FinishSessionModalProps) {
  const colors = useThemeColors();
  const { t } = useTranslation();
  const [focus, setFocus] = useState<SessionFocusOption | null>(null);
  const [mood, setMood] = useState<SessionMoodOption | null>(null);
  const [blocker, setBlocker] = useState<SessionBlockerOption | null>(null);

  useEffect(() => {
    if (visible) {
      setFocus(null);
      setMood(null);
      setBlocker(null);
    }
  }, [visible]);

  const handleSave = () => {
    onSave({ focus, mood, blocker });
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.centered}
        >
          <Pressable
            style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={(event) => event.stopPropagation()}
          >
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
              <ThemedText variant="subtitle">{t('reader.finishSessionTitle')}</ThemedText>
              <ThemedText variant="caption" secondary>
                {t('reader.finishSessionSubtitle')}
              </ThemedText>

              <View style={[styles.summaryBox, { backgroundColor: colors.background }]}>
                <ThemedText variant="caption">Page {startPage} → {endPage}</ThemedText>
                <ThemedText variant="caption">
                  {t('reader.pagesRead', { count: pagesRead })}
                </ThemedText>
                <ThemedText variant="caption">{formatReadingDuration(durationSeconds)}</ThemedText>
              </View>

              <ThemedText variant="label" secondary>
                Focus (optional)
              </ThemedText>
              <View style={styles.chipRow}>
                {FOCUS_OPTIONS.map(({ key, label }) => (
                  <OptionChip
                    key={key}
                    label={label}
                    selected={focus === key}
                    onPress={() => setFocus(focus === key ? null : key)}
                  />
                ))}
              </View>

              <ThemedText variant="label" secondary>
                Mood (optional)
              </ThemedText>
              <View style={styles.chipRow}>
                {MOOD_OPTIONS.map(({ key, label }) => (
                  <OptionChip
                    key={key}
                    label={label}
                    selected={mood === key}
                    onPress={() => setMood(mood === key ? null : key)}
                  />
                ))}
              </View>

              <ThemedText variant="label" secondary>
                Blocker (optional)
              </ThemedText>
              <View style={styles.chipRow}>
                {BLOCKER_OPTIONS.map(({ key, label }) => (
                  <OptionChip
                    key={key}
                    label={label}
                    selected={blocker === key}
                    onPress={() => setBlocker(blocker === key ? null : key)}
                  />
                ))}
              </View>

              <View style={styles.actions}>
                <Button label={t('common.cancel')} onPress={onClose} variant="secondary" disabled={saving} />
                <Pressable
                  onPress={handleSave}
                  disabled={saving}
                  style={({ pressed }) => [
                    styles.saveButton,
                    { backgroundColor: colors.tint, opacity: saving || pressed ? 0.7 : 1 },
                  ]}
                >
                  {saving ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <ThemedText variant="body" style={styles.saveLabel}>
                      {t('reader.saveSession')}
                    </ThemedText>
                  )}
                </Pressable>
              </View>
            </ScrollView>
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
  },
  centered: {
    width: '100%',
  },
  card: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    maxHeight: '88%',
  },
  scrollContent: {
    padding: 20,
    gap: 12,
  },
  summaryBox: {
    borderRadius: 12,
    padding: 14,
    gap: 4,
    marginVertical: 4,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  saveButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveLabel: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
