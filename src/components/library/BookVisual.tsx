import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/ui/ThemedText';
import { useThemeColors } from '@/hooks/useColorScheme';

const GRADIENTS: [string, string][] = [
  ['#5B8A72', '#7BA892'],
  ['#6B7FA8', '#8A9BC4'],
  ['#8A6B7F', '#A88A9E'],
  ['#7A8A6B', '#98A88A'],
  ['#8A7A6B', '#A8988A'],
  ['#6B8A8A', '#8AA8A8'],
];

function hashTitle(title: string): number {
  let hash = 0;
  for (let i = 0; i < title.length; i += 1) {
    hash = (hash * 31 + title.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function getInitials(title: string): string {
  const words = title.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) {
    return '?';
  }
  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }
  return `${words[0][0] ?? ''}${words[1][0] ?? ''}`.toUpperCase();
}

interface BookVisualProps {
  title: string;
  size?: 'sm' | 'md' | 'lg';
}

export function BookVisual({ title, size = 'md' }: BookVisualProps) {
  const colors = useThemeColors();
  const [start, end] = GRADIENTS[hashTitle(title) % GRADIENTS.length];
  const initials = getInitials(title);
  const dimension = size === 'lg' ? 72 : size === 'sm' ? 44 : 56;
  const fontSize = size === 'lg' ? 24 : size === 'sm' ? 14 : 18;

  return (
    <View
      style={[
        styles.container,
        {
          width: dimension,
          height: dimension,
          borderRadius: size === 'lg' ? 14 : 10,
          backgroundColor: start,
          borderColor: colors.border,
        },
      ]}
    >
      <View style={[styles.inner, { backgroundColor: end, opacity: 0.35 }]} />
      <ThemedText style={[styles.initials, { fontSize, color: '#FFFFFF' }]}>{initials}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
  inner: {
    ...StyleSheet.absoluteFillObject,
  },
  initials: {
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
