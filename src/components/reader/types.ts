export interface PdfViewerProps {
  uri: string;
  /** Frozen at first mount — never updated reactively. Used as initial `page` on native PDF only. */
  initialPage: number;
  onLoadComplete: (pageCount: number) => void;
  onPageChanged: (page: number, pageCount: number) => void;
  onError: (error: unknown) => void;
}

export interface PdfRef {
  setPage(pageNumber: number): void;
}
