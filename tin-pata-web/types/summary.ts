export type SummaryScope = 'current' | 'range' | 'chapter';
export type SummaryLanguage = 'en' | 'bn';
export type SummaryLength = 'short' | 'detailed';

export interface PdfChapter {
  title: string;
  startPage: number;
  endPage: number;
}

export interface SummaryRequest {
  bookId: string;
  pageStart: number;
  pageEnd: number;
  language: SummaryLanguage;
  length: SummaryLength;
  text: string;
}

export interface SummaryQuota {
  used: number;
  limit: number;
  remaining: number;
}

export type SummaryResult =
  | {
      ok: true;
      summary: string;
      cached: boolean;
      model: string;
      quota: SummaryQuota | null;
    }
  | {
      ok: false;
      error: string;
      code?:
        | 'AUTH'
        | 'BOOK'
        | 'CONFIG'
        | 'INPUT'
        | 'NO_TEXT'
        | 'QUOTA'
        | 'PROVIDER'
        | 'DATABASE';
      quota?: SummaryQuota;
    };
