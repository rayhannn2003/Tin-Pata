import { Platform, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/ui/ThemedText';
import { useThemeColors } from '@/hooks/useColorScheme';
import { isDatabaseNative } from '@/db/database';

export function WebPreviewBanner() {
  const colors = useThemeColors();

  if (Platform.OS !== 'web' || isDatabaseNative) {
    return null;
  }

  return (
    <View style={[styles.banner, { backgroundColor: colors.tintMuted, borderColor: colors.border }]}>
      <ThemedText variant="caption" style={styles.text}>
        Web preview — SQLite runs on device. Scan the QR code with Expo Go for the full app.
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  text: {
    textAlign: 'center',
    lineHeight: 18,
  },
});
