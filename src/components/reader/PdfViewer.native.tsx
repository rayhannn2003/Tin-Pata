import { forwardRef, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { loadNativePdfComponent } from '@/components/reader/pdfNativeModule';
import type { PdfRef, PdfViewerProps } from '@/components/reader/types';
import { ThemedText } from '@/components/ui/ThemedText';
import { useThemeColors } from '@/hooks/useColorScheme';

export type { PdfRef, PdfViewerProps };

export const PdfViewer = forwardRef<PdfRef, PdfViewerProps>(function PdfViewer(
  { uri, page, onLoadComplete, onPageChanged, onError },
  ref,
) {
  const colors = useThemeColors();
  const [layout, setLayout] = useState({ width: 0, height: 0 });
  const PdfComponent = useMemo(() => loadNativePdfComponent(), []);

  const hasSize = layout.width > 0 && layout.height > 0;

  if (!PdfComponent) {
    return (
      <View style={styles.wrapper}>
        <ThemedText secondary style={styles.fallbackText}>
          PDF native module is not available. Rebuild the app with npx expo run:android.
        </ThemedText>
      </View>
    );
  }

  return (
    <View
      style={styles.wrapper}
      onLayout={(event) => {
        const { width, height } = event.nativeEvent.layout;
        if (width > 0 && height > 0) {
          setLayout((current) =>
            current.width === width && current.height === height
              ? current
              : { width, height },
          );
        }
      }}
    >
      {hasSize ? (
        <PdfComponent
          ref={ref}
          source={{ uri, cache: false }}
          page={page}
          trustAllCerts={false}
          enablePaging={false}
          spacing={4}
          fitPolicy={2}
          onLoadComplete={(numberOfPages) => {
            onLoadComplete(numberOfPages);
          }}
          onPageChanged={(currentPage, numberOfPages) => {
            onPageChanged(currentPage, numberOfPages);
          }}
          onError={(error) => {
            onError(error);
          }}
          renderActivityIndicator={() => (
            <ActivityIndicator color={colors.tint} size="large" />
          )}
          style={[
            styles.pdf,
            {
              width: layout.width,
              height: layout.height,
              backgroundColor: colors.surface,
            },
          ]}
        />
      ) : (
        <View style={styles.measuring}>
          <ActivityIndicator color={colors.tint} size="large" />
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    minHeight: 0,
    width: '100%',
  },
  pdf: {
    flex: 1,
  },
  measuring: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackText: {
    textAlign: 'center',
    padding: 24,
  },
});
