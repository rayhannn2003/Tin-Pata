import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/ui/ThemedText';
import { useThemeColors } from '@/hooks/useColorScheme';

type ButtonVariant = 'primary' | 'secondary' | 'danger';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
}: ButtonProps) {
  const colors = useThemeColors();

  const backgroundColor =
    variant === 'primary'
      ? colors.tint
      : variant === 'danger'
        ? colors.dangerMuted
        : colors.surface;

  const textColor =
    variant === 'primary'
      ? '#FFFFFF'
      : variant === 'danger'
        ? colors.danger
        : colors.text;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor,
          borderColor: variant === 'secondary' ? colors.border : backgroundColor,
          opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
        },
      ]}
    >
      <ThemedText variant="body" style={[styles.label, { color: textColor }]}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  label: {
    fontWeight: '600',
  },
});
