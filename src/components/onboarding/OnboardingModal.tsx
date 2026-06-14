import { useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { ThemedText } from '@/components/ui/ThemedText';
import { useTranslation } from '@/i18n/useTranslation';
import { Radius, Spacing } from '@/constants/layout';
import { useThemeColors } from '@/hooks/useColorScheme';

interface OnboardingModalProps {
  visible: boolean;
  onComplete: () => void;
  onSkip: () => void;
}

export function OnboardingModal({ visible, onComplete, onSkip }: OnboardingModalProps) {
  const colors = useThemeColors();
  const { t } = useTranslation();
  const [step, setStep] = useState(0);

  const steps = [
    { title: t('onboarding.step1Title'), body: t('onboarding.step1Body') },
    { title: t('onboarding.step2Title'), body: t('onboarding.step2Body') },
    { title: t('onboarding.step3Title'), body: t('onboarding.step3Body') },
  ];

  const current = steps[step];
  const isLast = step === steps.length - 1;

  const handleNext = () => {
    if (isLast) {
      setStep(0);
      onComplete();
      return;
    }
    setStep((s) => s + 1);
  };

  const handleSkip = () => {
    setStep(0);
    onSkip();
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.backdrop}>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <ThemedText variant="caption" secondary style={styles.step}>
            {t('onboarding.step', { current: step + 1, total: steps.length })}
          </ThemedText>
          <ThemedText variant="title" style={styles.title}>
            {current.title}
          </ThemedText>
          <ThemedText secondary style={styles.body}>
            {current.body}
          </ThemedText>

          <View style={styles.dots}>
            {steps.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.dot,
                  {
                    backgroundColor: index === step ? colors.tint : colors.border,
                  },
                ]}
              />
            ))}
          </View>

          <View style={styles.actions}>
            <Pressable onPress={handleSkip} hitSlop={8}>
              <ThemedText variant="caption" secondary>
                {t('common.skip')}
              </ThemedText>
            </Pressable>
            <Button
              label={isLast ? t('onboarding.getStarted') : t('common.next')}
              onPress={handleNext}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  card: {
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.xl,
    gap: Spacing.md,
  },
  step: { textTransform: 'uppercase', letterSpacing: 0.5 },
  title: { marginTop: Spacing.xs },
  body: { lineHeight: 24 },
  dots: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.md,
  },
});
