import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ThemedText } from '@/components/ui/ThemedText';
import { useTranslation } from '@/i18n/useTranslation';
import { Spacing } from '@/constants/layout';
import { RescueService, RescueError } from '@/services/RescueService';
import { useThemeColors } from '@/hooks/useColorScheme';
import type { RescueOption } from '@/types/rescue';

const RESCUE_LABEL_KEYS: Record<RescueOption['id'], { label: string; description: string }> = {
  one_page: { label: 'rescue.onePage', description: 'rescue.onePageDesc' },
  three_minutes: { label: 'rescue.threeMinutes', description: 'rescue.threeMinutesDesc' },
  continue: { label: 'rescue.continueLast', description: 'rescue.continueLastDesc' },
  reflect: { label: 'rescue.writeStuck', description: 'rescue.writeStuckDesc' },
};

export function ReaderBlockRescueCard() {
  const router = useRouter();
  const colors = useThemeColors();
  const { t } = useTranslation();
  const [reflectVisible, setReflectVisible] = useState(false);
  const [reflectionText, setReflectionText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const options = useMemo(
    () =>
      RescueService.getRescueOptions().map((option) => ({
        ...option,
        label: t(RESCUE_LABEL_KEYS[option.id].label),
        description: t(RESCUE_LABEL_KEYS[option.id].description),
      })),
    [t],
  );

  const handleOption = async (id: string) => {
    try {
      setError(null);
      setSuccess(null);
      if (id === 'one_page') {
        const result = await RescueService.startOnePageRescue();
        router.push(result.route as `/reader/${string}`);
        return;
      }
      if (id === 'three_minutes') {
        const result = await RescueService.startThreeMinuteRescue();
        router.push(result.route as `/reader/${string}`);
        return;
      }
      if (id === 'continue') {
        const result = await RescueService.startContinueRescue();
        router.push(result.route as `/reader/${string}`);
        return;
      }
      if (id === 'reflect') {
        setReflectVisible(true);
      }
    } catch (err) {
      setError(err instanceof RescueError ? err.message : t('rescue.startError'));
    }
  };

  const handleSaveReflection = async () => {
    try {
      setSaving(true);
      setError(null);
      const book = await RescueService.getLastReadingBook();
      await RescueService.saveStuckReflection(reflectionText, book?.id ?? null);
      setReflectVisible(false);
      setReflectionText('');
      setSuccess(t('rescue.reflectionSaved'));
    } catch (err) {
      setError(err instanceof RescueError ? err.message : t('rescue.saveError'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Card style={styles.card}>
        <ThemedText variant="subtitle">{t('rescue.title')}</ThemedText>
        <ThemedText variant="caption" secondary>
          {t('rescue.recovery')}
        </ThemedText>

        <View style={styles.options}>
          {options.map((option) => (
            <Pressable
              key={option.id}
              onPress={() => void handleOption(option.id)}
              style={({ pressed }) => [
                styles.option,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}
            >
              <ThemedText style={styles.optionLabel}>{option.label}</ThemedText>
              <ThemedText variant="caption" secondary>
                {option.description}
              </ThemedText>
            </Pressable>
          ))}
        </View>

        {success ? (
          <ThemedText variant="caption" style={{ color: colors.tint }}>
            {success}
          </ThemedText>
        ) : null}

        {error ? (
          <ThemedText variant="caption" style={{ color: colors.danger }}>
            {error}
          </ThemedText>
        ) : null}

        <Pressable onPress={() => router.push('/settings')} hitSlop={8}>
          <ThemedText variant="caption" style={{ color: colors.tint }}>
            {t('rescue.viewHistory')}
          </ThemedText>
        </Pressable>
      </Card>

      <Modal
        visible={reflectVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setReflectVisible(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setReflectVisible(false)}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.modalCentered}
          >
            <Pressable
              style={[styles.modalCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={(event) => event.stopPropagation()}
            >
              <ThemedText variant="subtitle">{t('rescue.reflectionModalTitle')}</ThemedText>
              <ThemedText variant="caption" secondary>
                {t('rescue.reflectionModalSubtitle')}
              </ThemedText>
              <TextInput
                value={reflectionText}
                onChangeText={setReflectionText}
                placeholder={t('rescue.reflectionPlaceholder')}
                placeholderTextColor={colors.textSecondary}
                multiline
                textAlignVertical="top"
                style={[
                  styles.input,
                  {
                    color: colors.text,
                    borderColor: colors.border,
                    backgroundColor: colors.background,
                  },
                ]}
                autoFocus
              />
              <View style={styles.modalActions}>
                <Button
                  label={t('common.cancel')}
                  onPress={() => setReflectVisible(false)}
                  variant="secondary"
                  disabled={saving}
                />
                <Button
                  label={saving ? t('notifications.saving') : t('common.save')}
                  onPress={() => void handleSaveReflection()}
                  disabled={saving}
                />
              </View>
            </Pressable>
          </KeyboardAvoidingView>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  card: { gap: Spacing.md },
  options: { gap: Spacing.sm },
  option: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 4,
  },
  optionLabel: { fontWeight: '600', fontSize: 15 },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    padding: 24,
  },
  modalCentered: { width: '100%' },
  modalCard: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 20,
    gap: 12,
  },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    minHeight: 120,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
  },
});
