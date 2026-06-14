import { useCallback, useEffect, useRef, useState } from 'react';

import { BookService } from '@/services/BookService';
import {
  PAGE_SAVE_DEBOUNCE_MS,
  PDF_LOAD_TIMEOUT_MS,
  PdfReaderError,
  PdfReaderService,
} from '@/services/PdfReaderService';
import type { PdfRef } from '@/components/reader/types';
import { isPdfNativeModuleLinked } from '@/components/reader/pdfNativeModule';
import type { Book } from '@/types';

import { useBook } from '@/features/books/useBook';

export type ReaderScreenState =
  | 'loading_book'
  | 'unsupported'
  | 'error'
  | 'ready';

interface UsePdfReaderResult {
  state: ReaderScreenState;
  book: Book | null;
  pdfUri: string | null;
  initialPage: number;
  currentPage: number;
  totalPages: number;
  pdfLoading: boolean;
  resumeHint: string | null;
  errorMessage: string | null;
  goToPageVisible: boolean;
  goToPageError: string | null;
  pdfRef: React.RefObject<PdfRef | null>;
  openGoToPage: () => void;
  closeGoToPage: () => void;
  submitGoToPage: (input: string) => void;
  jumpToPage: (page: number) => void;
  handlePdfLoadComplete: (pageCount: number) => void;
  handlePdfPageChanged: (page: number, pageCount: number) => void;
  handlePdfLoadError: (error: unknown) => void;
  handlePdfLoadStart: () => void;
}

export function usePdfReader(bookId: string | undefined): UsePdfReaderResult {
  const { book, loading: bookLoading, error: bookLoadError } = useBook(bookId);
  const pdfRef = useRef<PdfRef | null>(null);

  const [state, setState] = useState<ReaderScreenState>('loading_book');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pdfUri, setPdfUri] = useState<string | null>(null);
  const [initialPage, setInitialPage] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [pdfLoading, setPdfLoading] = useState(true);
  const [resumeHint, setResumeHint] = useState<string | null>(null);
  const [goToPageVisible, setGoToPageVisible] = useState(false);
  const [goToPageError, setGoToPageError] = useState<string | null>(null);

  const lastSavedPageRef = useRef(1);
  const currentPageRef = useRef(1);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loadTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const totalPagesPersistedRef = useRef(false);

  const clearLoadTimeout = useCallback(() => {
    if (loadTimeoutRef.current) {
      clearTimeout(loadTimeoutRef.current);
      loadTimeoutRef.current = null;
    }
  }, []);

  const scheduleLoadTimeout = useCallback(() => {
    clearLoadTimeout();
    loadTimeoutRef.current = setTimeout(() => {
      setPdfLoading(false);
      setState('error');
      setErrorMessage(
        'The PDF took too long to open. Try closing and reopening, or re-import the file.',
      );
    }, PDF_LOAD_TIMEOUT_MS);
  }, [clearLoadTimeout]);

  const clearSaveTimer = useCallback(() => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
  }, []);

  const persistPageNow = useCallback(
    async (page: number) => {
      if (!bookId || page === lastSavedPageRef.current) {
        return;
      }
      lastSavedPageRef.current = page;
      try {
        await BookService.updateProgress(bookId, { currentPage: page });
      } catch {
        // Keep reading; progress will retry on next page change.
      }
    },
    [bookId],
  );

  const schedulePageSave = useCallback(
    (page: number) => {
      if (!bookId) {
        return;
      }
      clearSaveTimer();
      saveTimerRef.current = setTimeout(() => {
        void persistPageNow(page);
      }, PAGE_SAVE_DEBOUNCE_MS);
    },
    [bookId, clearSaveTimer, persistPageNow],
  );

  const persistTotalPages = useCallback(
    async (pageCount: number) => {
      if (!bookId || pageCount <= 0 || totalPagesPersistedRef.current) {
        return;
      }
      if (book && book.totalPages > 0) {
        totalPagesPersistedRef.current = true;
        return;
      }
      totalPagesPersistedRef.current = true;
      try {
        await BookService.updateProgress(bookId, { totalPages: pageCount });
      } catch {
        totalPagesPersistedRef.current = false;
      }
    },
    [book, bookId],
  );

  useEffect(() => {
    if (bookLoading) {
      setState('loading_book');
      return;
    }

    if (!isPdfNativeModuleLinked()) {
      setState('unsupported');
      setErrorMessage(
        'The PDF reader is not available in this build. Rebuild with: npx expo run:android',
      );
      return;
    }

    if (bookLoadError) {
      setState('error');
      setErrorMessage(bookLoadError);
      return;
    }

    try {
      const verified = PdfReaderService.verifyBookForReading(book, bookId);
      const startPage = PdfReaderService.initialPageForBook(verified);
      const uri = PdfReaderService.resolveReaderUri(verified);

      setPdfUri(uri);
      setInitialPage(startPage);
      setCurrentPage(startPage);
      currentPageRef.current = startPage;
      setTotalPages(verified.totalPages > 0 ? verified.totalPages : 0);
      lastSavedPageRef.current = verified.currentPage;
      totalPagesPersistedRef.current = verified.totalPages > 0;
      setPdfLoading(true);
      setErrorMessage(null);
      setState('ready');
      scheduleLoadTimeout();

      if (PdfReaderService.shouldShowResumeHint(verified)) {
        setResumeHint(`Resuming from page ${startPage}`);
        if (resumeTimerRef.current) {
          clearTimeout(resumeTimerRef.current);
        }
        resumeTimerRef.current = setTimeout(() => {
          setResumeHint(null);
        }, 3500);
      } else {
        setResumeHint(null);
      }
    } catch (error) {
      setState('error');
      setErrorMessage(
        error instanceof PdfReaderError
          ? error.message
          : 'Could not prepare the reader.',
      );
    }
  }, [book, bookId, bookLoadError, bookLoading, scheduleLoadTimeout]);

  useEffect(() => {
    currentPageRef.current = currentPage;
  }, [currentPage]);

  useEffect(() => {
    return () => {
      clearSaveTimer();
      clearLoadTimeout();
      if (resumeTimerRef.current) {
        clearTimeout(resumeTimerRef.current);
      }
      if (bookId && currentPageRef.current !== lastSavedPageRef.current) {
        void BookService.updateProgress(bookId, { currentPage: currentPageRef.current });
      }
    };
  }, [bookId, clearLoadTimeout, clearSaveTimer]);

  const handlePdfLoadStart = useCallback(() => {
    if (pdfLoading) {
      return;
    }
    setPdfLoading(true);
    scheduleLoadTimeout();
  }, [pdfLoading, scheduleLoadTimeout]);

  const handlePdfLoadComplete = useCallback(
    (pageCount: number) => {
      clearLoadTimeout();
      setPdfLoading(false);
      if (pageCount > 0) {
        setTotalPages(pageCount);
        void persistTotalPages(pageCount);
      }
    },
    [clearLoadTimeout, persistTotalPages],
  );

  const handlePdfPageChanged = useCallback(
    (page: number, pageCount: number) => {
      const clamped = PdfReaderService.clampPage(
        page,
        pageCount > 0 ? pageCount : totalPages,
      );
      setCurrentPage(clamped);
      if (pageCount > 0) {
        setTotalPages(pageCount);
      }
      schedulePageSave(clamped);
    },
    [schedulePageSave, totalPages],
  );

  const handlePdfLoadError = useCallback((error: unknown) => {
    clearLoadTimeout();
    setPdfLoading(false);
    setState('error');
    setErrorMessage(PdfReaderService.formatPdfLoadError(error));
  }, [clearLoadTimeout]);

  const jumpToPage = useCallback(
    (page: number) => {
      const clamped = PdfReaderService.clampPage(
        page,
        totalPages > 0 ? totalPages : page,
      );
      setCurrentPage(clamped);
      pdfRef.current?.setPage(clamped);
      void persistPageNow(clamped);
      setGoToPageVisible(false);
      setGoToPageError(null);
    },
    [persistPageNow, totalPages],
  );

  const openGoToPage = useCallback(() => {
    setGoToPageError(null);
    setGoToPageVisible(true);
  }, []);

  const closeGoToPage = useCallback(() => {
    setGoToPageVisible(false);
    setGoToPageError(null);
  }, []);

  const submitGoToPage = useCallback(
    (input: string) => {
      const result = PdfReaderService.validatePageInput(input, totalPages);
      if (!result.ok) {
        setGoToPageError(result.message);
        return;
      }
      jumpToPage(result.page);
    },
    [jumpToPage, totalPages],
  );

  return {
    state,
    book,
    pdfUri,
    initialPage,
    currentPage,
    totalPages,
    pdfLoading,
    resumeHint,
    errorMessage,
    goToPageVisible,
    goToPageError,
    pdfRef,
    openGoToPage,
    closeGoToPage,
    submitGoToPage,
    jumpToPage,
    handlePdfLoadComplete,
    handlePdfPageChanged,
    handlePdfLoadError,
    handlePdfLoadStart,
  };
}
