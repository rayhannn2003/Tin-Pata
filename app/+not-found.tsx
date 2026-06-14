import { Link, Stack } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/ui/ThemedText';
import { useThemeColors } from '@/hooks/useColorScheme';

export default function NotFoundScreen() {
  const colors = useThemeColors();

  return (
    <>
      <Stack.Screen options={{ title: 'Not found' }} />
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ThemedText variant="title">Page not found</ThemedText>
        <Link href="/" style={styles.link}>
          <ThemedText style={{ color: colors.tint }}>Go to Home</ThemedText>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    padding: 20,
  },
  link: { marginTop: 8 },
});
