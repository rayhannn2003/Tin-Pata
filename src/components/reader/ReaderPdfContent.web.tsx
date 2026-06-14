import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/ui/ThemedText';

export function ReaderPdfContent() {
  return (
    <View style={styles.container}>
      <ThemedText secondary style={styles.message}>
        PDF reading is not available in the web preview.
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  message: { textAlign: 'center' },
});
