import { forwardRef } from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/ui/ThemedText';
import type { PdfRef, PdfViewerProps } from '@/components/reader/types';

export type { PdfRef, PdfViewerProps };

export const PdfViewer = forwardRef<PdfRef, PdfViewerProps>(function PdfViewerWeb(
  _props,
  _ref,
) {
  return (
    <View style={styles.container}>
      <ThemedText secondary style={styles.message}>
        PDF reading is not available in the web preview. Use an Android development build on a
        device or emulator.
      </ThemedText>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  message: { textAlign: 'center' },
});
