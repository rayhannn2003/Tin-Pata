import { memo, type RefObject } from 'react';
import { StyleSheet, View } from 'react-native';

import { PdfViewer } from '@/components/reader/PdfViewer';
import type { PdfRef } from '@/components/reader/types';

interface ReaderPdfContentProps {
  pdfRef: RefObject<PdfRef | null>;
  uri: string;
  initialPage: number;
  onLoadComplete: (pageCount: number) => void;
  onPageChanged: (page: number, pageCount: number) => void;
  onError: (error: unknown) => void;
}

function readerPdfPropsAreEqual(
  prev: ReaderPdfContentProps,
  next: ReaderPdfContentProps,
): boolean {
  return (
    prev.uri === next.uri &&
    prev.initialPage === next.initialPage &&
    prev.pdfRef === next.pdfRef &&
    prev.onLoadComplete === next.onLoadComplete &&
    prev.onPageChanged === next.onPageChanged &&
    prev.onError === next.onError
  );
}

export const ReaderPdfContent = memo(function ReaderPdfContent({
  pdfRef,
  uri,
  initialPage,
  onLoadComplete,
  onPageChanged,
  onError,
}: ReaderPdfContentProps) {
  return (
    <View style={styles.container}>
      <PdfViewer
        ref={pdfRef}
        uri={uri}
        initialPage={initialPage}
        onLoadComplete={onLoadComplete}
        onPageChanged={onPageChanged}
        onError={onError}
      />
    </View>
  );
}, readerPdfPropsAreEqual);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: 0,
    width: '100%',
  },
});
