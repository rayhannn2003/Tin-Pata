import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { loadNativePdfComponent } from '@/components/reader/pdfNativeModule';
import type { PdfRef, PdfViewerProps } from '@/components/reader/types';
import { ThemedText } from '@/components/ui/ThemedText';
import { useThemeColors } from '@/hooks/useColorScheme';

/** Stable layout: auto fit, vertical continuous scroll. Auto-resume via initial `page` prop only. */
const STABLE_FIT_POLICY = 2 as const;
const STABLE_ENABLE_PAGING = false;

export type { PdfRef, PdfViewerProps };

export const PdfViewer = forwardRef<PdfRef, PdfViewerProps>(function PdfViewer(
  { uri, initialPage, onLoadComplete, onPageChanged, onError },
  ref,
) {
  const colors = useThemeColors();
  const [layout, setLayout] = useState({ width: 0, height: 0 });
  const PdfComponent = useMemo(() => loadNativePdfComponent(), []);

  /** Never changes after first mount — avoids reactive page prop remounts/jumps. */
  const frozenInitialPageRef = useRef(Math.max(1, Math.floor(initialPage)));

  const nativePdfRef = useRef<{ setPage: (page: number) => void } | null>(null);
  const isMountedRef = useRef(true);
  const isLoadedRef = useRef(false);
  const hasErrorRef = useRef(false);
  const totalPagesRef = useRef(0);
  const lastSetPageRef = useRef(frozenInitialPageRef.current);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const clampPage = useCallback((page: number): number => {
    const normalized = Math.max(1, Math.floor(page));
    if (totalPagesRef.current > 0) {
      return Math.min(normalized, totalPagesRef.current);
    }
    return normalized;
  }, []);

  const safeSetPage = useCallback((page: number) => {
    if (!isMountedRef.current || !isLoadedRef.current || hasErrorRef.current) {
      return false;
    }
    const clamped = clampPage(page);
    if (clamped === lastSetPageRef.current) {
      return false;
    }
    lastSetPageRef.current = clamped;
    nativePdfRef.current?.setPage(clamped);
    return true;
  }, [clampPage]);

  useImperativeHandle(
    ref,
    () => ({
      setPage(pageNumber: number) {
        safeSetPage(pageNumber);
      },
    }),
    [safeSetPage],
  );

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
          ref={nativePdfRef}
          source={{ uri, cache: false }}
          page={frozenInitialPageRef.current}
          trustAllCerts={false}
          enablePaging={STABLE_ENABLE_PAGING}
          spacing={4}
          fitPolicy={STABLE_FIT_POLICY}
          onLoadComplete={(numberOfPages: number) => {
            if (!isMountedRef.current || hasErrorRef.current) {
              return;
            }
            isLoadedRef.current = true;
            totalPagesRef.current = numberOfPages;
            lastSetPageRef.current = frozenInitialPageRef.current;
            onLoadComplete(numberOfPages);
          }}
          onPageChanged={(currentPage: number, numberOfPages: number) => {
            if (!isMountedRef.current || hasErrorRef.current) {
              return;
            }
            if (numberOfPages > 0) {
              totalPagesRef.current = numberOfPages;
            }
            lastSetPageRef.current = currentPage;
            onPageChanged(currentPage, numberOfPages);
          }}
          onError={(error: unknown) => {
            hasErrorRef.current = true;
            isLoadedRef.current = false;
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
