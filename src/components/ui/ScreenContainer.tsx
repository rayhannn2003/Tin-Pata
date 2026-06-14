import { ScrollView, StyleSheet, View, type ViewProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { StickySafeHeader } from '@/components/ui/StickySafeHeader';
import { useThemeColors } from '@/hooks/useColorScheme';

interface ScreenContainerProps extends ViewProps {
  scroll?: boolean;
  padded?: boolean;
}

export function ScreenContainer({
  scroll = true,
  padded = true,
  style,
  children,
  ...props
}: ScreenContainerProps) {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();

  const content = (
    <View
      style={[
        styles.inner,
        padded && styles.padded,
        { paddingBottom: Math.max(insets.bottom, 16) },
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );

  if (scroll) {
    return (
      <View style={[styles.flex, { backgroundColor: colors.background }]}>
        <StickySafeHeader />
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {content}
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[styles.flex, { backgroundColor: colors.background }]}>
      <StickySafeHeader />
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  inner: { flex: 1 },
  padded: { paddingHorizontal: 20, paddingTop: 8 },
});
