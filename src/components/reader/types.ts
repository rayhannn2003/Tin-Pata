export interface PdfViewerProps {
  uri: string;
  page: number;
  onLoadStart?: () => void;
  onLoadComplete: (pageCount: number) => void;
  onPageChanged: (page: number, pageCount: number) => void;
  onError: (error: unknown) => void;
}

export interface PdfRef {
  setPage(pageNumber: number): void;
}
