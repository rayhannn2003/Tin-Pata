'use client';

import dynamic from 'next/dynamic';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { PDFDocumentProxy } from 'pdfjs-dist';

import { ExplanationPanel } from '@/components/ai/ExplanationPanel';
import { AiSummaryDialog } from '@/components/reader/AiSummaryDialog';
import { DictionaryPanel } from '@/components/reader/DictionaryPanel';
import { GoToPageDialog } from '@/components/reader/GoToPageDialog';
import { NoteEditorDialog } from '@/components/reader/NoteEditorDialog';
import { ReaderBookmarks } from '@/components/reader/ReaderBookmarks';
import { ReaderError } from '@/components/reader/ReaderError';
import { ReaderLoading } from '@/components/reader/ReaderLoading';
import { ReaderNotes } from '@/components/reader/ReaderNotes';
import { ReaderProgress } from '@/components/reader/ReaderProgress';
import { ReaderSettings } from '@/components/reader/ReaderSettings';
import { ReaderSidebar } from '@/components/reader/ReaderSidebar';
import { ReaderToolbar } from '@/components/reader/ReaderToolbar';
import { useTheme } from '@/components/providers/ThemeProvider';
import { CheckpointService } from '@/services/CheckpointService';
import { PdfStorageService } from '@/services/PdfStorageService';
import { ReaderSyncService } from '@/services/ReaderSyncService';
import { UserSettingsService } from '@/services/UserSettingsService';
import type { AIPreferences } from '@/types/ai';
import { DEFAULT_AI_PREFERENCES } from '@/types/ai';
import type { Book } from '@/types/book';
import type { Bookmark } from '@/types/bookmark';
import type { ReaderCheckpoint } from '@/types/checkpoint';
import type { DictionaryPreferences } from '@/types/dictionary';
import { DEFAULT_DICTIONARY_PREFERENCES } from '@/types/dictionary';
import type { Note } from '@/types/note';
import type { ReaderLoadError, ReaderPreferences, ReaderZoomMode } from '@/types/reader';
import { DEFAULT_READER_PREFERENCES } from '@/types/reader';
import { debounce } from '@/utils/debounce';
import { clearWordHighlight, highlightCurrentSelection } from '@/utils/pdfTextSelection';

const PdfContainer = dynamic(
  () => import('@/components/reader/PdfContainer').then((m) => m.PdfContainer),
  { ssr: false, loading: () => <ReaderLoading label="Preparing pages…" /> },
);

interface ReaderExperienceProps {
  book: Book;
}

export function ReaderExperience({ book }: ReaderExperienceProps) {
  const { theme, setTheme } = useTheme();
  const [pdf, setPdf] = useState<PDFDocumentProxy | null>(null);
  const [loadError, setLoadError] = useState<ReaderLoadError | null>(null);
  const [unavailable, setUnavailable] = useState(false);
  const [loadPercent, setLoadPercent] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [retryToken, setRetryToken] = useState(0);

  const [currentPage, setCurrentPage] = useState(book.currentPage || 1);
  const [pageCount, setPageCount] = useState(book.totalPages || 0);
  const [zoomMode, setZoomMode] = useState<ReaderZoomMode>(DEFAULT_READER_PREFERENCES.zoomMode);
  const [zoomScale, setZoomScale] = useState(DEFAULT_READER_PREFERENCES.zoomScale);
  const [displayScale, setDisplayScale] = useState(1);
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);
  const [leftWidth, setLeftWidth] = useState(260);
  const [rightWidth, setRightWidth] = useState(280);
  const [fullscreen, setFullscreen] = useState(false);
  const [prefsReady, setPrefsReady] = useState(false);

  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [checkpoints, setCheckpoints] = useState<ReaderCheckpoint[]>([]);
  const [checkpointDrawMode, setCheckpointDrawMode] = useState(false);
  const [goToOpen, setGoToOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [dictionaryOpen, setDictionaryOpen] = useState(false);
  const [dictionaryWord, setDictionaryWord] = useState('');
  const [dictionaryPrefs, setDictionaryPrefs] = useState<DictionaryPreferences>(
    DEFAULT_DICTIONARY_PREFERENCES,
  );
  const [aiPrefs, setAiPrefs] = useState<AIPreferences>(DEFAULT_AI_PREFERENCES);
  const [explainPassage, setExplainPassage] = useState<{
    text: string;
    pageNumber: number;
  } | null>(null);
  const [noteEditorOpen, setNoteEditorOpen] = useState(false);
  const [noteInitialText, setNoteInitialText] = useState('');
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [mobileDrawer, setMobileDrawer] = useState<'bookmarks' | 'notes' | null>(null);
  const [scrollRequest, setScrollRequest] = useState<number | null>(null);

  const shellRef = useRef<HTMLDivElement>(null);
  const panelsBeforeFocusRef = useRef({ left: true, right: true });
  const sessionRef = useRef({
    startPage: book.currentPage || 1,
    startTimeMs: 0,
    finished: false,
  });
  const statusRef = useRef(book.status);
  const pageRef = useRef(book.currentPage || 1);
  const bookIdRef = useRef(book.id);
  const pageCountRef = useRef(pageCount);
  const finishSessionRef = useRef<() => Promise<void>>(async () => undefined);
  const persistProgressRef = useRef<ReturnType<typeof debounce<(p: number) => void>> | null>(null);
  const persistPrefsRef = useRef<ReturnType<typeof debounce<(partial: Partial<ReaderPreferences>) => void>> | null>(
    null,
  );

  useEffect(() => {
    bookIdRef.current = book.id;
  }, [book.id]);

  useEffect(() => {
    pageCountRef.current = pageCount;
  }, [pageCount]);

  useEffect(() => {
    pageRef.current = currentPage;
  }, [currentPage]);

  useEffect(() => {
    statusRef.current = book.status;
  }, [book.status]);

  useEffect(() => {
    persistProgressRef.current = debounce((page: number) => {
      void ReaderSyncService.updateProgress({
        bookId: bookIdRef.current,
        currentPage: page,
        totalPages: pageCountRef.current,
        previousStatus: statusRef.current,
      }).then((result) => {
        if (result.ok && statusRef.current === 'not_started') {
          statusRef.current = 'reading';
        }
      });
    }, 1800);

    persistPrefsRef.current = debounce((partial: Partial<ReaderPreferences>) => {
      void UserSettingsService.saveReaderPreferences(partial);
    }, 800);

    return () => {
      persistProgressRef.current?.cancel();
      persistPrefsRef.current?.cancel();
    };
  }, []);

  const bookmarked = useMemo(
    () => bookmarks.some((b) => b.pageNumber === currentPage),
    [bookmarks, currentPage],
  );

  const persistProgress = useCallback((page: number) => {
    persistProgressRef.current?.(page);
  }, []);

  const persistPrefs = useCallback((partial: Partial<ReaderPreferences>) => {
    persistPrefsRef.current?.(partial);
  }, []);

  const finishSession = useCallback(async () => {
    if (sessionRef.current.finished) return;
    sessionRef.current.finished = true;
    persistProgressRef.current?.flush();
    const started = sessionRef.current.startTimeMs || Date.now();
    const durationSeconds = (Date.now() - started) / 1000;
    await ReaderSyncService.finishSession({
      bookId: bookIdRef.current,
      startPage: sessionRef.current.startPage,
      endPage: pageRef.current,
      durationSeconds,
    });
  }, []);

  useEffect(() => {
    finishSessionRef.current = finishSession;
  }, [finishSession]);

  useEffect(() => {
    let cancelled = false;
    void Promise.all([
      UserSettingsService.loadReaderPreferences(),
      UserSettingsService.loadDictionaryPreferences(),
      UserSettingsService.loadAiPreferences(),
    ]).then(([prefs, dictPrefs, aiPreferences]) => {
      if (cancelled) return;
      setZoomMode(prefs.zoomMode);
      setZoomScale(prefs.zoomScale);
      setLeftOpen(prefs.leftSidebarOpen);
      setRightOpen(prefs.rightSidebarOpen);
      setTheme(prefs.theme);
      setDictionaryPrefs(dictPrefs);
      setAiPrefs(aiPreferences);
      setPrefsReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, [setTheme]);

  useEffect(() => {
    let cancelled = false;
    let doc: PDFDocumentProxy | null = null;

    async function load() {
      setLoading(true);
      setLoadError(null);
      setUnavailable(false);
      setLoadPercent(null);
      setPdf(null);

      if (!book.pdfCloudAvailable || !book.cloudStoragePath) {
        if (!cancelled) {
          setUnavailable(true);
          setLoadError({
            kind: 'unavailable',
            message: 'PDF is not available in cloud storage.',
          });
          setLoading(false);
        }
        return;
      }

      const signed = await PdfStorageService.createSignedUrl(book.cloudStoragePath);
      if (cancelled) return;
      if (!signed.url) {
        setLoadError({
          kind: signed.kind ?? 'unknown',
          message: signed.error ?? 'Could not load PDF.',
        });
        setUnavailable(signed.kind === 'unavailable');
        setLoading(false);
        return;
      }

      try {
        const pdfjs = await import('pdfjs-dist');
        pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
        const loadingTask = pdfjs.getDocument({ url: signed.url });
        loadingTask.onProgress = (progress: { loaded: number; total: number }) => {
          if (progress.total > 0) {
            setLoadPercent((progress.loaded / progress.total) * 100);
          }
        };
        doc = await loadingTask.promise;
        if (cancelled) {
          void doc.destroy();
          return;
        }
        setPdf(doc);
        setPageCount(doc.numPages);
        const start = Math.min(Math.max(1, book.currentPage || 1), doc.numPages);
        setCurrentPage(start);
        sessionRef.current = {
          startPage: start,
          startTimeMs: Date.now(),
          finished: false,
        };
        setLoading(false);
      } catch (err) {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : 'Failed to open PDF.';
        const kind = /Invalid PDF|corrupted|format/i.test(message) ? 'corrupt' : 'unknown';
        setLoadError({ kind, message });
        setLoading(false);
      }
    }

    void load();
    void ReaderSyncService.listBookmarks(book.id).then((rows) => {
      if (!cancelled) setBookmarks(rows);
    });
    void ReaderSyncService.listNotes(book.id).then((rows) => {
      if (!cancelled) setNotes(rows);
    });
    void Promise.resolve(CheckpointService.list(book.id)).then((rows) => {
      if (!cancelled) setCheckpoints(rows);
    });

    return () => {
      cancelled = true;
      void finishSessionRef.current();
      void doc?.destroy();
    };
  }, [book.id, book.cloudStoragePath, book.pdfCloudAvailable, book.currentPage, retryToken]);

  useEffect(() => {
    function onVis() {
      if (document.visibilityState === 'hidden') {
        void finishSessionRef.current().then(() => {
          sessionRef.current = {
            startPage: pageRef.current,
            startTimeMs: Date.now(),
            finished: false,
          };
        });
      }
    }
    function onHide() {
      void finishSessionRef.current();
    }
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('pagehide', onHide);
    return () => {
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('pagehide', onHide);
    };
  }, []);

  const handlePageChange = useCallback(
    (page: number) => {
      setCurrentPage(page);
      persistProgress(page);
    },
    [persistProgress],
  );

  const jumpToPage = useCallback((page: number) => {
    setScrollRequest(page);
    setCurrentPage(page);
    setMobileDrawer(null);
  }, []);

  const toggleBookmark = useCallback(async () => {
    const existing = bookmarks.find((b) => b.pageNumber === currentPage);
    if (existing) {
      const result = await ReaderSyncService.deleteBookmark(existing.id);
      if (result.ok) {
        setBookmarks((prev) => prev.filter((b) => b.id !== existing.id));
      }
      return;
    }
    const result = await ReaderSyncService.createBookmark(book.id, currentPage);
    if (result.ok && result.bookmark) {
      setBookmarks((prev) =>
        [...prev, result.bookmark!].sort((a, b) => a.pageNumber - b.pageNumber),
      );
    }
  }, [bookmarks, book.id, currentPage]);

  const saveNote = useCallback(
    async (text: string) => {
      if (editingNote) {
        const result = await ReaderSyncService.updateNote(editingNote.id, text);
        if (result.ok) {
          setNotes((prev) =>
            prev.map((n) =>
              n.id === editingNote.id
                ? { ...n, noteText: text.trim(), updatedAt: new Date().toISOString() }
                : n,
            ),
          );
        }
      } else {
        const result = await ReaderSyncService.createNote(book.id, currentPage, text);
        if (result.ok && result.note) {
          setNotes((prev) => [result.note!, ...prev]);
        }
      }
      setNoteEditorOpen(false);
      setEditingNote(null);
      setNoteInitialText('');
    },
    [editingNote, book.id, currentPage],
  );

  const deleteBookmark = useCallback((id: string) => {
    void ReaderSyncService.deleteBookmark(id).then((r) => {
      if (r.ok) setBookmarks((prev) => prev.filter((b) => b.id !== id));
    });
  }, []);

  const deleteNote = useCallback((id: string) => {
    void ReaderSyncService.deleteNote(id).then((r) => {
      if (r.ok) setNotes((prev) => prev.filter((n) => n.id !== id));
    });
  }, []);

  const toggleCheckpointDrawMode = useCallback(() => {
    setCheckpointDrawMode((prev) => !prev);
  }, []);

  const handleCheckpointDraw = useCallback(
    (payload: {
      pageNumber: number;
      yRatio: number;
      xStartRatio: number;
      xEndRatio: number;
    }) => {
      const created = CheckpointService.create({
        bookId: book.id,
        pageNumber: payload.pageNumber,
        yRatio: payload.yRatio,
        xStartRatio: payload.xStartRatio,
        xEndRatio: payload.xEndRatio,
      });
      setCheckpoints(CheckpointService.list(book.id));
      setCheckpointDrawMode(false);
      setCurrentPage(created.pageNumber);
      if (!leftOpen) {
        setLeftOpen(true);
        persistPrefs({ leftSidebarOpen: true });
      }
    },
    [book.id, leftOpen, persistPrefs],
  );

  const deleteCheckpoint = useCallback(
    (id: string) => {
      CheckpointService.remove(book.id, id);
      setCheckpoints(CheckpointService.list(book.id));
    },
    [book.id],
  );

  const updateAiPref = useCallback(
    <K extends keyof AIPreferences>(key: K, value: AIPreferences[K]) => {
      setAiPrefs((prev) => {
        const next = { ...prev, [key]: value };
        void UserSettingsService.saveAiPreferences({ [key]: value });
        return next;
      });
    },
    [],
  );

  const openExplanation = useCallback(
    (passage: { text: string; pageNumber: number }) => {
      if (!passage.text.trim()) return;
      if (passage.pageNumber >= 1) {
        setCurrentPage(passage.pageNumber);
        pageRef.current = passage.pageNumber;
      }
      setExplainPassage(passage);
    },
    [],
  );

  const closeExplanation = useCallback(() => {
    setExplainPassage(null);
  }, []);

  const updateDictionaryPref = useCallback(
    <K extends keyof DictionaryPreferences>(key: K, value: DictionaryPreferences[K]) => {
      setDictionaryPrefs((prev) => {
        const next = { ...prev, [key]: value };
        void UserSettingsService.saveDictionaryPreferences({ [key]: value });
        return next;
      });
    },
    [],
  );

  const openNewNote = useCallback((prefill = '') => {
    setEditingNote(null);
    setNoteInitialText(prefill);
    setNoteEditorOpen(true);
  }, []);

  const openEditNote = useCallback((note: Note) => {
    setEditingNote(note);
    setNoteInitialText('');
    setNoteEditorOpen(true);
  }, []);

  const closeDictionary = useCallback(() => {
    clearWordHighlight();
    setDictionaryOpen(false);
    setDictionaryWord('');
  }, []);

  const openDictionary = useCallback((word: unknown = '') => {
    const next = typeof word === 'string' ? word : '';
    setDictionaryWord(next);
    setDictionaryOpen(true);
  }, []);

  const handleWordSelect = useCallback(
    (word: string, pageNumber: number) => {
      if (pageNumber >= 1) {
        setCurrentPage(pageNumber);
        pageRef.current = pageNumber;
      }
      if (dictionaryPrefs.highlightOnPage) {
        highlightCurrentSelection();
      }
      openDictionary(word);
    },
    [dictionaryPrefs.highlightOnPage, openDictionary],
  );

  const toggleFullscreen = useCallback(async () => {
    const el = shellRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      await el.requestFullscreen().catch(() => undefined);
    } else {
      await document.exitFullscreen().catch(() => undefined);
    }
  }, []);

  useEffect(() => {
    function onFs() {
      setFullscreen(Boolean(document.fullscreenElement));
    }
    document.addEventListener('fullscreenchange', onFs);
    return () => document.removeEventListener('fullscreenchange', onFs);
  }, []);

  function setZoom(mode: ReaderZoomMode, scale?: number) {
    setZoomMode(mode);
    if (scale != null) setZoomScale(scale);
    persistPrefs({ zoomMode: mode, zoomScale: scale ?? zoomScale });
  }

  function zoomIn() {
    setZoom('custom', Math.min(3, Math.round((displayScale + 0.1) * 10) / 10));
  }

  function zoomOut() {
    setZoom('custom', Math.max(0.5, Math.round((displayScale - 0.1) * 10) / 10));
  }

  const setLeftSidebar = useCallback((open: boolean) => {
    setLeftOpen(open);
    persistPrefs({ leftSidebarOpen: open });
  }, [persistPrefs]);

  const setRightSidebar = useCallback((open: boolean) => {
    setRightOpen(open);
    persistPrefs({ rightSidebarOpen: open });
  }, [persistPrefs]);

  const toggleLeft = useCallback(() => {
    setLeftOpen((v) => {
      persistPrefs({ leftSidebarOpen: !v });
      return !v;
    });
  }, [persistPrefs]);

  const toggleRight = useCallback(() => {
    setRightOpen((v) => {
      persistPrefs({ rightSidebarOpen: !v });
      return !v;
    });
  }, [persistPrefs]);

  const toggleFocusMode = useCallback(() => {
    if (leftOpen || rightOpen) {
      panelsBeforeFocusRef.current = { left: leftOpen, right: rightOpen };
      setLeftOpen(false);
      setRightOpen(false);
      persistPrefs({ leftSidebarOpen: false, rightSidebarOpen: false });
      return;
    }
    const restore = panelsBeforeFocusRef.current;
    const nextLeft = restore.left || restore.right ? restore.left : true;
    const nextRight = restore.left || restore.right ? restore.right : true;
    setLeftOpen(nextLeft);
    setRightOpen(nextRight);
    persistPrefs({ leftSidebarOpen: nextLeft, rightSidebarOpen: nextRight });
  }, [leftOpen, rightOpen, persistPrefs]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)
      ) {
        return;
      }
      if (event.key === 'ArrowRight' || event.key === 'PageDown') {
        event.preventDefault();
        jumpToPage(Math.min(pageCount, currentPage + 1));
      } else if (event.key === 'ArrowLeft' || event.key === 'PageUp') {
        event.preventDefault();
        jumpToPage(Math.max(1, currentPage - 1));
      } else if (event.key === 'b' || event.key === 'B') {
        event.preventDefault();
        void toggleBookmark();
      } else if (event.key === 'n' || event.key === 'N') {
        event.preventDefault();
        openNewNote();
      } else if (event.key === 'd' || event.key === 'D') {
        event.preventDefault();
        openDictionary();
      } else if (event.key === 's' || event.key === 'S') {
        event.preventDefault();
        setSummaryOpen(true);
      } else if (event.key === 'c' || event.key === 'C') {
        event.preventDefault();
        toggleCheckpointDrawMode();
      } else if (event.key === 'Escape' && checkpointDrawMode) {
        event.preventDefault();
        setCheckpointDrawMode(false);
      } else if ((event.key === 'f' || event.key === 'F') && !event.ctrlKey && !event.metaKey) {
        event.preventDefault();
        void toggleFullscreen();
      } else if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'f') {
        event.preventDefault();
      } else if (event.key === 'Escape' && document.fullscreenElement) {
        void document.exitFullscreen();
      } else if (event.key === 'g' || event.key === 'G') {
        setGoToOpen(true);
      } else if (event.key === 'h' || event.key === 'H') {
        event.preventDefault();
        toggleFocusMode();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [
    currentPage,
    pageCount,
    jumpToPage,
    toggleBookmark,
    toggleFullscreen,
    openNewNote,
    openDictionary,
    toggleFocusMode,
    toggleCheckpointDrawMode,
    checkpointDrawMode,
  ]);

  function startResize(side: 'left' | 'right', event: React.PointerEvent) {
    event.preventDefault();
    const startX = event.clientX;
    const startW = side === 'left' ? leftWidth : rightWidth;
    function onMove(e: PointerEvent) {
      const delta = e.clientX - startX;
      const next =
        side === 'left'
          ? Math.min(400, Math.max(200, startW + delta))
          : Math.min(400, Math.max(200, startW - delta));
      if (side === 'left') setLeftWidth(next);
      else setRightWidth(next);
    }
    function onUp() {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    }
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  }

  if (!prefsReady || loading) {
    return <ReaderLoading percent={loadPercent} />;
  }

  if (loadError || unavailable) {
    return (
      <ReaderError
        error={loadError ?? { kind: 'unavailable', message: 'Unavailable' }}
        unavailable={unavailable}
        onRetry={() => setRetryToken((n) => n + 1)}
      />
    );
  }

  const sidebarProps = {
    bookmarks,
    notes,
    checkpoints,
    checkpointDrawMode,
    currentPage,
    onJump: jumpToPage,
    onDeleteBookmark: deleteBookmark,
    onCreateBookmark: () => void toggleBookmark(),
    onCreateNote: () => openNewNote(),
    onEditNote: openEditNote,
    onDeleteNote: deleteNote,
    onDeleteCheckpoint: deleteCheckpoint,
    onStartCheckpointDraw: () => {
      setCheckpointDrawMode(true);
      if (!leftOpen) setLeftSidebar(true);
    },
  };

  return (
    <div ref={shellRef} className="flex h-dvh flex-col bg-background text-foreground">
      <ReaderToolbar
        title={book.title}
        bookId={book.id}
        currentPage={currentPage}
        totalPages={pageCount}
        zoomMode={zoomMode}
        displayScale={displayScale}
        bookmarked={bookmarked}
        fullscreen={fullscreen}
        leftOpen={leftOpen}
        rightOpen={rightOpen}
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
        onFitWidth={() => setZoom('fit-width')}
        onFitPage={() => setZoom('fit-page')}
        onToggleFullscreen={() => void toggleFullscreen()}
        onToggleBookmark={() => void toggleBookmark()}
        onOpenGoToPage={() => setGoToOpen(true)}
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenDictionary={() => openDictionary()}
        onOpenSummary={() => setSummaryOpen(true)}
        onNewNote={() => openNewNote()}
        onToggleCheckpointMode={toggleCheckpointDrawMode}
        checkpointDrawMode={checkpointDrawMode}
        onToggleLeft={toggleLeft}
        onToggleRight={toggleRight}
        onToggleFocusMode={toggleFocusMode}
      />

      <div className="relative flex min-h-0 flex-1">
        <ReaderSidebar
          side="left"
          open={leftOpen}
          width={leftWidth}
          {...sidebarProps}
          onCollapse={() => setLeftSidebar(false)}
          onExpand={() => setLeftSidebar(true)}
          onResizeStart={(e) => startResize('left', e)}
        />

        <div className="relative min-w-0 flex-1">
          {pdf ? (
            <PdfContainer
              pdf={pdf}
              pageCount={pageCount}
              initialPage={Math.min(book.currentPage || 1, pageCount)}
              zoomMode={zoomMode}
              zoomScale={zoomScale}
              onPageChange={handlePageChange}
              onZoomScaleResolved={setDisplayScale}
              scrollToPageRequest={scrollRequest}
              onScrollToPageHandled={() => setScrollRequest(null)}
              onWordSelect={handleWordSelect}
              onExplainSelection={openExplanation}
              dictionaryOpen={dictionaryOpen}
              onCloseDictionary={closeDictionary}
              openOnDoubleClick={dictionaryPrefs.openOnDoubleClick}
              checkpoints={checkpoints}
              checkpointDrawMode={checkpointDrawMode}
              onCheckpointDraw={handleCheckpointDraw}
              onCheckpointDelete={deleteCheckpoint}
            />
          ) : null}

          <div className="absolute bottom-4 right-4 flex flex-col gap-2 lg:hidden">
            <button
              type="button"
              onClick={() => setMobileDrawer('bookmarks')}
              className="rounded-full bg-surface px-3 py-2 text-xs font-medium shadow-md ring-1 ring-border"
            >
              Bookmarks
            </button>
            <button
              type="button"
              onClick={() => setMobileDrawer('notes')}
              className="rounded-full bg-surface px-3 py-2 text-xs font-medium shadow-md ring-1 ring-border"
            >
              Notes
            </button>
          </div>
        </div>

        <ReaderSidebar
          side="right"
          open={rightOpen}
          width={rightWidth}
          {...sidebarProps}
          onCollapse={() => setRightSidebar(false)}
          onExpand={() => setRightSidebar(true)}
          onResizeStart={(e) => startResize('right', e)}
        />
      </div>

      <ReaderProgress currentPage={currentPage} totalPages={pageCount} />

      {mobileDrawer ? (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label="Close drawer"
            onClick={() => setMobileDrawer(null)}
          />
          <div className="absolute inset-x-0 bottom-0 h-[70vh] overflow-hidden rounded-t-xl border border-border bg-surface shadow-lg">
            {mobileDrawer === 'bookmarks' ? (
              <ReaderBookmarks
                bookmarks={bookmarks}
                currentPage={currentPage}
                onJump={jumpToPage}
                onDelete={deleteBookmark}
                onCreate={() => void toggleBookmark()}
                showTitle
              />
            ) : (
              <ReaderNotes
                notes={notes}
                currentPage={currentPage}
                onJump={jumpToPage}
                onEdit={openEditNote}
                onDelete={deleteNote}
                onCreate={() => openNewNote()}
                showTitle
              />
            )}
          </div>
        </div>
      ) : null}

      <GoToPageDialog
        open={goToOpen}
        currentPage={currentPage}
        totalPages={pageCount}
        onClose={() => setGoToOpen(false)}
        onGo={jumpToPage}
      />
      <DictionaryPanel
        open={dictionaryOpen}
        pageNumber={currentPage}
        initialWord={dictionaryWord}
        preferences={dictionaryPrefs}
        onClose={closeDictionary}
        onAddToNote={(text) => {
          closeDictionary();
          openNewNote(text);
        }}
      />
      {pdf ? (
        <AiSummaryDialog
          open={summaryOpen}
          pdf={pdf}
          bookId={book.id}
          currentPage={currentPage}
          pageCount={pageCount}
          onClose={() => setSummaryOpen(false)}
          onSaveAsNote={(text, targetPage) => {
            setSummaryOpen(false);
            jumpToPage(targetPage);
            openNewNote(text);
          }}
        />
      ) : null}
      <ExplanationPanel
        open={explainPassage != null}
        selectedText={explainPassage?.text ?? ''}
        pageNumber={explainPassage?.pageNumber ?? currentPage}
        bookId={book.id}
        bookTitle={book.title}
        defaultMode={aiPrefs.defaultExplanationMode}
        onModeChange={(mode) => updateAiPref('defaultExplanationMode', mode)}
        onClose={closeExplanation}
      />
      <NoteEditorDialog
        open={noteEditorOpen}
        pageNumber={editingNote?.pageNumber ?? currentPage}
        note={editingNote}
        initialText={noteInitialText}
        onClose={() => {
          setNoteEditorOpen(false);
          setEditingNote(null);
          setNoteInitialText('');
        }}
        onSave={(text) => void saveNote(text)}
      />
      <ReaderSettings
        open={settingsOpen}
        theme={theme}
        zoomMode={zoomMode}
        leftOpen={leftOpen}
        rightOpen={rightOpen}
        dictionaryPrefs={dictionaryPrefs}
        aiPrefs={aiPrefs}
        onClose={() => setSettingsOpen(false)}
        onThemeChange={(value) => {
          setTheme(value);
          persistPrefs({ theme: value });
        }}
        onToggleLeft={toggleLeft}
        onToggleRight={toggleRight}
        onDictionaryPrefChange={updateDictionaryPref}
        onAiPrefChange={updateAiPref}
      />
    </div>
  );
}
