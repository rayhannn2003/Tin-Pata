export interface PdfViewerProps {
  uri: string;
  /** Frozen at first mount — never updated reactively. Used as initial `page` on native PDF only. */
  initialPage: number;
  /** Frozen at first mount — maps from reader_fit_mode at session open. */
  fitPolicy: 0 | 1 | 2;
  /** Frozen at first mount — maps from reader_scroll_mode at session open. */
  enablePaging: boolean;
  onLoadComplete: (pageCount: number) => void;
  onPageChanged: (page: number, pageCount: number) => void;
  onError: (error: unknown) => void;
}

export interface PdfRef {
  setPage(pageNumber: number): void;
}
