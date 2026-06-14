import type React from 'react';

import type { PdfRef, PdfViewerProps } from './types';

export type { PdfRef, PdfViewerProps };

export const PdfViewer: React.ForwardRefExoticComponent<
  PdfViewerProps & React.RefAttributes<PdfRef>
>;
