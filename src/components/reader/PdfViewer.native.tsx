import {
  forwardRef,
  memo,
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
import { STABLE_READER_PDF_BEHAVIOR } from '@/types/reader';
import { ThemedText } from '@/components/ui/ThemedText';
import { useThemeColors } from '@/hooks/useColorScheme';

export type { PdfRef, PdfViewerProps };

export const PdfViewer = memo(
  forwardRef<PdfRef, PdfViewerProps>(function PdfViewer(
    { uri, initialPage, fitPolicy, enablePaging, onLoadComplete, onPageChanged, onError },
    ref,
  ) {
    const colors = useThemeColors();
    const [layout, setLayout] = useState({ width: 0, height: 0 });
    const PdfComponent = useMemo(() => loadNativePdfComponent(), []);

    /** Never changes after first mount for a given PDF URI. */
    const frozenInitialPageRef = useRef(Math.max(1, Math.floor(initialPage)));
    const frozenFitPolicyRef = useRef(fitPolicy ?? STABLE_READER_PDF_BEHAVIOR.fitPolicy);
    const frozenEnablePagingRef = useRef(
      enablePaging ?? STABLE_READER_PDF_BEHAVIOR.enablePaging,
    );

    const nativePdfRef = useRef<{ setPage: (page: number) => void } | null>(null);
    const isMountedRef = useRef(true);
    const isLoadedRef = useRef(false);
    const hasErrorRef = useRef(false);
    const totalPagesRef = useRef(0);
    const lastSetPageRef = useRef(frozenInitialPageRef.current);

    const onLoadCompleteRef = useRef(onLoadComplete);
    const onPageChangedRef = useRef(onPageChanged);
    const onErrorRef = useRef(onError);
    onLoadCompleteRef.current = onLoadComplete;
    onPageChangedRef.current = onPageChanged;
    onErrorRef.current = onError;

    useEffect(() => {
      isMountedRef.current = true;
      return () => {
        isMountedRef.current = false;
      };
    }, []);

    const source = useMemo(
      () => ({ uri, cache: false as const }),
      [uri],
    );

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

    const handleLoadComplete = useCallback((numberOfPages: number) => {
      if (!isMountedRef.current || hasErrorRef.current) {
        return;
      }
      isLoadedRef.current = true;
      totalPagesRef.current = numberOfPages;
      lastSetPageRef.current = frozenInitialPageRef.current;
      onLoadCompleteRef.current(numberOfPages);
    }, []);

    const handlePageChanged = useCallback((currentPage: number, numberOfPages: number) => {
      if (!isMountedRef.current || hasErrorRef.current) {
        return;
      }
      if (numberOfPages > 0) {
        totalPagesRef.current = numberOfPages;
      }
      lastSetPageRef.current = currentPage;
      onPageChangedRef.current(currentPage, numberOfPages);
    }, []);

    const handleError = useCallback((error: unknown) => {
      hasErrorRef.current = true;
      isLoadedRef.current = false;
      onErrorRef.current(error);
    }, []);

    const renderActivityIndicator = useCallback(
      () => <ActivityIndicator color={colors.tint} size="large" />,
      [colors.tint],
    );

    const pdfStyle = useMemo(
      () => [
        styles.pdf,
        {
          width: layout.width,
          height: layout.height,
          backgroundColor: colors.surface,
        },
      ],
      [colors.surface, layout.height, layout.width],
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
            source={source}
            page={frozenInitialPageRef.current}
            trustAllCerts={false}
            enablePaging={frozenEnablePagingRef.current}
            spacing={4}
            fitPolicy={frozenFitPolicyRef.current}
            onLoadComplete={handleLoadComplete}
            onPageChanged={handlePageChanged}
            onError={handleError}
            renderActivityIndicator={renderActivityIndicator}
            style={pdfStyle}
          />
        ) : (
          <View style={styles.measuring}>
            <ActivityIndicator color={colors.tint} size="large" />
          </View>
        )}
      </View>
    );
  }),
);

PdfViewer.displayName = 'PdfViewer';

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
