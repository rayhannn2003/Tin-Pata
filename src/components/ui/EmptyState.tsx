import { StyleSheet, View } from 'react-native';

import { Card } from '@/components/ui/Card';
import { ThemedText } from '@/components/ui/ThemedText';
import { useThemeColors } from '@/hooks/useColorScheme';

interface EmptyStateProps {
  title: string;
  message: string;
}

export function EmptyState({ title, message }: EmptyStateProps) {
  const colors = useThemeColors();

  return (
    <Card muted style={styles.container}>
      <View style={[styles.icon, { backgroundColor: colors.surface }]}>
        <ThemedText variant="subtitle" style={{ color: colors.tint }}>
          ···
        </ThemedText>
      </View>
      <ThemedText variant="subtitle">{title}</ThemedText>
      <ThemedText secondary style={styles.message}>
        {message}
      </ThemedText>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  icon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  message: {
    textAlign: 'center',
  },
});
