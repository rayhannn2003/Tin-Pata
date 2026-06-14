import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ThemedText } from '@/components/ui/ThemedText';
import { Radius, Spacing } from '@/constants/layout';
import { useThemeColors } from '@/hooks/useColorScheme';

interface AppEmptyStateProps {
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function AppEmptyState({ title, message, actionLabel, onAction }: AppEmptyStateProps) {
  const colors = useThemeColors();

  return (
    <Card muted style={styles.container}>
      <View style={[styles.icon, { backgroundColor: colors.tintMuted }]}>
        <ThemedText variant="subtitle" style={{ color: colors.tint }}>
          ···
        </ThemedText>
      </View>
      <ThemedText variant="subtitle" style={styles.title}>
        {title}
      </ThemedText>
      <ThemedText secondary style={styles.message}>
        {message}
      </ThemedText>
      {actionLabel && onAction ? (
        <View style={styles.action}>
          <Button label={actionLabel} onPress={onAction} />
        </View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.xl,
  },
  icon: {
    width: 52,
    height: 52,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  title: { textAlign: 'center' },
  message: { textAlign: 'center', lineHeight: 22 },
  action: { width: '100%', marginTop: Spacing.sm },
});
