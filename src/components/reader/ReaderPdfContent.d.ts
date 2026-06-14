import type { RefObject } from 'react';

import type { PdfRef } from './types';

export interface ReaderPdfContentProps {
  pdfRef: RefObject<PdfRef | null>;
  uri: string;
  initialPage: number;
  fitPolicy: 0 | 1 | 2;
  enablePaging: boolean;
  onLoadComplete: (pageCount: number) => void;
  onPageChanged: (page: number, pageCount: number) => void;
  onError: (error: unknown) => void;
}

export function ReaderPdfContent(props: ReaderPdfContentProps): React.JSX.Element;
