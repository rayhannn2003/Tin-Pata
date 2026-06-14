import { Pressable, StyleSheet, View, type ViewProps } from 'react-native';

import { useThemeColors } from '@/hooks/useColorScheme';

interface CardProps extends ViewProps {
  onPress?: () => void;
  muted?: boolean;
}

export function Card({ onPress, muted = false, style, children, ...props }: CardProps) {
  const colors = useThemeColors();

  const containerStyle = [
    styles.card,
    {
      backgroundColor: muted ? colors.tintMuted : colors.surface,
      borderColor: colors.border,
    },
    style,
  ];

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [containerStyle, pressed && styles.pressed]}
        {...props}
      >
        {children}
      </Pressable>
    );
  }

  return (
    <View style={containerStyle} {...props}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 16,
  },
  pressed: {
    opacity: 0.85,
  },
});
