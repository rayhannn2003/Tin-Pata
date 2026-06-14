import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { ThemedText } from '@/components/ui/ThemedText';
import { useTranslation } from '@/i18n/useTranslation';

interface ReaderErrorViewProps {
  title: string;
  message: string;
  onBack: () => void;
  hint?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function ReaderErrorView({
  title,
  message,
  onBack,
  hint,
  actionLabel,
  onAction,
}: ReaderErrorViewProps) {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <ThemedText variant="title">{title}</ThemedText>
      <ThemedText secondary>{message}</ThemedText>
      {hint ? (
        <ThemedText variant="caption" secondary>
          {hint}
        </ThemedText>
      ) : null}
      {actionLabel && onAction ? (
        <Button label={actionLabel} onPress={onAction} />
      ) : null}
      <Button label={t('common.goBack')} onPress={onBack} variant="secondary" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    gap: 14,
    paddingHorizontal: 20,
  },
});
