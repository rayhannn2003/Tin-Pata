import { StyleSheet, Text, type TextProps } from 'react-native';

import { useThemeColors } from '@/hooks/useColorScheme';

type Variant = 'title' | 'subtitle' | 'body' | 'caption' | 'label';

interface ThemedTextProps extends TextProps {
  variant?: Variant;
  secondary?: boolean;
}

const variantStyles = StyleSheet.create({
  title: { fontSize: 28, fontWeight: '600', lineHeight: 34 },
  subtitle: { fontSize: 18, fontWeight: '600', lineHeight: 24 },
  body: { fontSize: 16, lineHeight: 24 },
  caption: { fontSize: 14, lineHeight: 20 },
  label: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    lineHeight: 16,
  },
});

export function ThemedText({
  variant = 'body',
  secondary = false,
  style,
  ...props
}: ThemedTextProps) {
  const colors = useThemeColors();

  return (
    <Text
      style={[
        variantStyles[variant],
        { color: secondary ? colors.textSecondary : colors.text },
        style,
      ]}
      {...props}
    />
  );
}
