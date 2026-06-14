import { useCallback, useEffect, useRef, useState } from 'react';

import { BookService } from '@/services/BookService';
import { ReaderPreferencesService } from '@/services/ReaderPreferencesService';
import {
  PAGE_SAVE_DEBOUNCE_MS,
  PDF_LOAD_TIMEOUT_MS,
  PdfReaderError,
  PdfReaderService,
} from '@/services/PdfReaderService';
import type { PdfRef } from '@/components/reader/types';
import { isPdfNativeModuleLinked } from '@/components/reader/pdfNativeModule';
import type { Book } from '@/types';
import { STABLE_READER_PDF_BEHAVIOR, fitModeToFitPolicy, scrollModeToEnablePaging } from '@/types/reader';

import { useBook } from '@/features/books/useBook';

const PDF_STILL_LOADING_MESSAGE =
  'PDF is still loading. Try again in a moment.';

/** How long to wait after load before showing manual fallback if still on page 1. */
const AUTO_RESUME_CHECK_MS = 1500;

/** How long to show the success banner before hiding. */
const RESUMED_BANNER_DISMISS_MS = 3000;

export type ReaderScreenState =
  | 'loading_book'
  | 'unsupported'
  | 'error'
  | 'ready';

export type AutoResumeStatus = 'none' | 'opening' | 'resumed' | 'fallback';

interface UsePdfReaderResult {
  state: ReaderScreenState;
  book: Book | null;
  pdfUri: string | null;
  sessionFitPolicy: 0 | 1 | 2;
  sessionEnablePaging: boolean;
  initialResumePage: number;
  savedPage: number;
  currentPage: number;
  totalPages: number;
  pdfLoading: boolean;
  isPdfLoaded: boolean;
  autoResumeStatus: AutoResumeStatus;
  showLoadingJumpHint: boolean;
  errorMessage: string | null;
  pdfMissing: boolean;
  goToPageVisible: boolean;
  goToPageError: string | null;
  pdfRef: React.RefObject<PdfRef | null>;
  openGoToPage: () => void;
  closeGoToPage: () => void;
  submitGoToPage: (input: string) => void;
  jumpToPage: (page: number) => void;
  goToSavedPage: () => void;
  dismissFallbackBanner: () => void;
  clearLoadingJumpHint: () => void;
  handlePdfLoadComplete: (pageCount: number) => void;
  handlePdfPageChanged: (page: number, pageCount: number) => void;
  handlePdfLoadError: (error: unknown) => void;
}

export function usePdfReader(bookId: string | undefined): UsePdfReaderResult {
  const { book, loading: bookLoading, error: bookLoadError } = useBook(bookId);
  const pdfRef = useRef<PdfRef | null>(null);

  const [state, setState] = useState<ReaderScreenState>('loading_book');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pdfMissing, setPdfMissing] = useState(false);
  const [pdfUri, setPdfUri] = useState<string | null>(null);
  const [sessionFitPolicy, setSessionFitPolicy] = useState<0 | 1 | 2>(
    STABLE_READER_PDF_BEHAVIOR.fitPolicy,
  );
  const [sessionEnablePaging, setSessionEnablePaging] = useState(
    STABLE_READER_PDF_BEHAVIOR.enablePaging,
  );
  const [initialResumePage, setInitialResumePage] = useState(1);
  const [savedPage, setSavedPage] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [pdfLoading, setPdfLoading] = useState(true);
  const [isPdfLoaded, setIsPdfLoaded] = useState(false);
  const [autoResumeStatus, setAutoResumeStatus] = useState<AutoResumeStatus>('none');
  const [showLoadingJumpHint, setShowLoadingJumpHint] = useState(false);
  const [goToPageVisible, setGoToPageVisible] = useState(false);
  const [goToPageError, setGoToPageError] = useState<string | null>(null);

  const isMountedRef = useRef(true);
  const lastSavedPageRef = useRef(1);
  const currentPageRef = useRef(1);
  const totalPagesRef = useRef(0);
  const lastJumpedPageRef = useRef(0);
  const hasPdfErrorRef = useRef(false);
  const unmountFlushedRef = useRef(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loadTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fallbackCheckTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resumedDismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const totalPagesPersistedRef = useRef(false);
  const preparedBookIdRef = useRef<string | null>(null);
  const autoResumeTargetRef = useRef(1);
  const autoResumeSucceededRef = useRef(false);
  const initialResumePageRef = useRef(1);

  const clearLoadTimeout = useCallback(() => {
    if (loadTimeoutRef.current) {
      clearTimeout(loadTimeoutRef.current);
      loadTimeoutRef.current = null;
    }
  }, []);

  const clearFallbackCheckTimer = useCallback(() => {
    if (fallbackCheckTimerRef.current) {
      clearTimeout(fallbackCheckTimerRef.current);
      fallbackCheckTimerRef.current = null;
    }
  }, []);

  const clearResumedDismissTimer = useCallback(() => {
    if (resumedDismissTimerRef.current) {
      clearTimeout(resumedDismissTimerRef.current);
      resumedDismissTimerRef.current = null;
    }
  }, []);

  const scheduleLoadTimeout = useCallback(() => {
    clearLoadTimeout();
    loadTimeoutRef.current = setTimeout(() => {
      if (!isMountedRef.current) {
        return;
      }
      hasPdfErrorRef.current = true;
      setPdfLoading(false);
      setIsPdfLoaded(false);
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

  const markAutoResumeSucceeded = useCallback(() => {
    if (autoResumeSucceededRef.current) {
      return;
    }
    autoResumeSucceededRef.current = true;
    clearFallbackCheckTimer();
    setAutoResumeStatus('resumed');
    clearResumedDismissTimer();
    resumedDismissTimerRef.current = setTimeout(() => {
      if (isMountedRef.current) {
        setAutoResumeStatus('none');
      }
    }, RESUMED_BANNER_DISMISS_MS);
  }, [clearFallbackCheckTimer, clearResumedDismissTimer]);

  const scheduleFallbackCheck = useCallback(() => {
    clearFallbackCheckTimer();
    if (autoResumeTargetRef.current <= 1) {
      return;
    }
    fallbackCheckTimerRef.current = setTimeout(() => {
      if (!isMountedRef.current || autoResumeSucceededRef.current) {
        return;
      }
      if (currentPageRef.current === 1) {
        setAutoResumeStatus('fallback');
      }
    }, AUTO_RESUME_CHECK_MS);
  }, [clearFallbackCheckTimer]);

  const persistPageNow = useCallback(
    async (page: number) => {
      if (!bookId || !isMountedRef.current || page === lastSavedPageRef.current) {
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
      if (!bookId || hasPdfErrorRef.current) {
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
    isMountedRef.current = true;
    unmountFlushedRef.current = false;
    return () => {
      isMountedRef.current = false;
      clearSaveTimer();
      clearLoadTimeout();
      clearFallbackCheckTimer();
      clearResumedDismissTimer();
      if (
        bookId &&
        !unmountFlushedRef.current &&
        currentPageRef.current !== lastSavedPageRef.current
      ) {
        unmountFlushedRef.current = true;
        void BookService.updateProgress(bookId, { currentPage: currentPageRef.current });
      }
    };
  }, [
    bookId,
    clearFallbackCheckTimer,
    clearLoadTimeout,
    clearResumedDismissTimer,
    clearSaveTimer,
  ]);

  useEffect(() => {
    currentPageRef.current = currentPage;
  }, [currentPage]);

  useEffect(() => {
    totalPagesRef.current = totalPages;
  }, [totalPages]);

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

    if (!bookId || !book) {
      return;
    }

    if (preparedBookIdRef.current === bookId && state === 'ready') {
      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        const prefs = await ReaderPreferencesService.getPreferences();
        if (cancelled) {
          return;
        }

        const verified = PdfReaderService.verifyBookForReading(book, bookId);
        const knownTotal =
          verified.totalPages > 0 ? verified.totalPages : verified.currentPage;
        const storedPage = PdfReaderService.clampPage(
          PdfReaderService.initialPageForBook(verified),
          knownTotal > 0 ? knownTotal : verified.currentPage,
        );
        const uri = PdfReaderService.resolveReaderUri(verified);
        const fitPolicy = fitModeToFitPolicy(prefs.fitMode);
        const enablePaging = scrollModeToEnablePaging(prefs.scrollMode);

        if (cancelled) {
          return;
        }

        preparedBookIdRef.current = bookId;
        hasPdfErrorRef.current = false;
        lastJumpedPageRef.current = 0;
        autoResumeSucceededRef.current = false;
        autoResumeTargetRef.current = storedPage;
        initialResumePageRef.current = storedPage;
        clearFallbackCheckTimer();
        clearResumedDismissTimer();

        setSessionFitPolicy(fitPolicy);
        setSessionEnablePaging(enablePaging);
        setPdfUri(uri);
        setInitialResumePage(storedPage);
        setSavedPage(storedPage);
        setCurrentPage(storedPage > 1 ? storedPage : 1);
        currentPageRef.current = storedPage > 1 ? storedPage : 1;
        setTotalPages(verified.totalPages > 0 ? verified.totalPages : 0);
        totalPagesRef.current = verified.totalPages > 0 ? verified.totalPages : 0;
        lastSavedPageRef.current = verified.currentPage;
        totalPagesPersistedRef.current = verified.totalPages > 0;
        setPdfLoading(true);
        setIsPdfLoaded(false);
        setShowLoadingJumpHint(false);
        setErrorMessage(null);
        setPdfMissing(false);
        setAutoResumeStatus(storedPage > 1 ? 'opening' : 'none');
        setState('ready');
        scheduleLoadTimeout();
      } catch (error) {
        if (cancelled) {
          return;
        }
        setState('error');
        if (error instanceof PdfReaderError && error.code === 'pdf_missing') {
          setPdfMissing(true);
          setErrorMessage(error.message);
        } else {
          setPdfMissing(false);
          setErrorMessage(
            error instanceof PdfReaderError
              ? error.message
              : 'Could not prepare the reader.',
          );
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    book,
    bookId,
    bookLoadError,
    bookLoading,
    clearFallbackCheckTimer,
    clearResumedDismissTimer,
    scheduleLoadTimeout,
    state,
  ]);

  const handlePdfLoadComplete = useCallback(
    (pageCount: number) => {
      if (!isMountedRef.current || hasPdfErrorRef.current) {
        return;
      }
      clearLoadTimeout();
      setPdfLoading(false);
      setIsPdfLoaded(true);
      if (pageCount > 0) {
        setTotalPages(pageCount);
        totalPagesRef.current = pageCount;
        void persistTotalPages(pageCount);
        if (bookId) {
          void BookService.clampProgressAfterPdfLoad(bookId, pageCount).then((adjusted) => {
            if (adjusted && isMountedRef.current) {
              const clamped = PdfReaderService.clampPage(
                autoResumeTargetRef.current,
                pageCount,
              );
              if (clamped !== autoResumeTargetRef.current) {
                setCurrentPage(clamped);
                currentPageRef.current = clamped;
                setAutoResumeStatus('fallback');
              }
            }
          });
        }
      }

      if (autoResumeTargetRef.current > 1) {
        if (pageCount > 0 && autoResumeTargetRef.current > pageCount) {
          setAutoResumeStatus('fallback');
          return;
        }
        scheduleFallbackCheck();
      }
    },
    [bookId, clearLoadTimeout, persistTotalPages, scheduleFallbackCheck],
  );

  const handlePdfPageChanged = useCallback(
    (page: number, pageCount: number) => {
      if (!isMountedRef.current || hasPdfErrorRef.current) {
        return;
      }
      const clamped = PdfReaderService.clampPage(
        page,
        pageCount > 0 ? pageCount : totalPagesRef.current,
      );
      setCurrentPage(clamped);
      currentPageRef.current = clamped;
      if (pageCount > 0) {
        setTotalPages(pageCount);
        totalPagesRef.current = pageCount;
      }
      schedulePageSave(clamped);

      if (
        autoResumeTargetRef.current > 1 &&
        clamped === autoResumeTargetRef.current
      ) {
        markAutoResumeSucceeded();
      }
    },
    [markAutoResumeSucceeded, schedulePageSave],
  );

  const handlePdfLoadError = useCallback(
    (error: unknown) => {
      if (!isMountedRef.current) {
        return;
      }
      hasPdfErrorRef.current = true;
      clearLoadTimeout();
      clearFallbackCheckTimer();
      clearResumedDismissTimer();
      setPdfLoading(false);
      setIsPdfLoaded(false);
      setAutoResumeStatus('none');
      setState('error');
      setErrorMessage(PdfReaderService.formatPdfLoadError(error));
    },
    [clearFallbackCheckTimer, clearLoadTimeout, clearResumedDismissTimer],
  );

  const jumpToPage = useCallback(
    (page: number) => {
      if (!isMountedRef.current || hasPdfErrorRef.current) {
        return;
      }
      if (!isPdfLoaded) {
        setShowLoadingJumpHint(true);
        return;
      }
      const clamped = PdfReaderService.clampPage(
        page,
        totalPagesRef.current > 0 ? totalPagesRef.current : page,
      );
      if (clamped === lastJumpedPageRef.current && clamped === currentPageRef.current) {
        setGoToPageVisible(false);
        setGoToPageError(null);
        return;
      }
      lastJumpedPageRef.current = clamped;
      pdfRef.current?.setPage(clamped);
      setGoToPageVisible(false);
      setGoToPageError(null);
      setShowLoadingJumpHint(false);
      setAutoResumeStatus('none');
    },
    [isPdfLoaded],
  );

  const goToSavedPage = useCallback(() => {
    if (savedPage <= 1) {
      return;
    }
    jumpToPage(savedPage);
    setAutoResumeStatus('none');
  }, [jumpToPage, savedPage]);

  const dismissFallbackBanner = useCallback(() => {
    setAutoResumeStatus('none');
  }, []);

  const clearLoadingJumpHint = useCallback(() => {
    setShowLoadingJumpHint(false);
  }, []);

  const openGoToPage = useCallback(() => {
    if (hasPdfErrorRef.current) {
      return;
    }
    if (!isPdfLoaded) {
      setShowLoadingJumpHint(true);
      return;
    }
    setGoToPageError(null);
    setGoToPageVisible(true);
  }, [isPdfLoaded]);

  const closeGoToPage = useCallback(() => {
    setGoToPageVisible(false);
    setGoToPageError(null);
  }, []);

  const submitGoToPage = useCallback(
    (input: string) => {
      if (!isMountedRef.current || hasPdfErrorRef.current) {
        return;
      }
      if (!isPdfLoaded) {
        setGoToPageError(PDF_STILL_LOADING_MESSAGE);
        return;
      }
      const result = PdfReaderService.validatePageInput(input, totalPagesRef.current);
      if (!result.ok) {
        setGoToPageError(result.message);
        return;
      }
      jumpToPage(result.page);
    },
    [isPdfLoaded, jumpToPage],
  );

  return {
    state,
    book,
    pdfUri,
    sessionFitPolicy,
    sessionEnablePaging,
    initialResumePage,
    savedPage,
    currentPage,
    totalPages,
    pdfLoading,
    isPdfLoaded,
    autoResumeStatus,
    showLoadingJumpHint,
    errorMessage,
    pdfMissing,
    goToPageVisible,
    goToPageError,
    pdfRef,
    openGoToPage,
    closeGoToPage,
    submitGoToPage,
    jumpToPage,
    goToSavedPage,
    dismissFallbackBanner,
    clearLoadingJumpHint,
    handlePdfLoadComplete,
    handlePdfPageChanged,
    handlePdfLoadError,
  };
}
