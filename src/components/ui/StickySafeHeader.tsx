import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useThemeColors } from '@/hooks/useColorScheme';

/**
 * Empty sticky bar below the status bar so scroll content
 * does not overlap time, battery, or notifications.
 */
export function StickySafeHeader() {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();

  return (
    <View
      style={[
        styles.bar,
        {
          height: Math.max(insets.top, 8),
          backgroundColor: colors.background,
          borderBottomColor: colors.border,
        },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  bar: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});
