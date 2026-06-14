import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, BackHandler, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';

import { FeedbackBanner } from '@/components/common/FeedbackBanner';
import { BookmarkListModal } from '@/components/reader/BookmarkListModal';
import { ReaderComfortModal } from '@/components/reader/ReaderComfortModal';
import { FinishSessionModal } from '@/components/reader/FinishSessionModal';
import { GoToPageModal } from '@/components/reader/GoToPageModal';
import { LastReadBanner } from '@/components/reader/LastReadBanner';
import { NoteEditorModal } from '@/components/reader/NoteEditorModal';
import { NotesListModal } from '@/components/reader/NotesListModal';
import { PdfReaderToolbar } from '@/components/reader/PdfReaderToolbar';
import { ReaderActionBar } from '@/components/reader/ReaderActionBar';
import { ReaderListsModal } from '@/components/reader/ReaderListsModal';
import { ReaderPdfContent } from '@/components/reader/ReaderPdfContent';
import { ReaderErrorView } from '@/components/reader/ReaderErrorView';
import { RescueBanner } from '@/components/reader/RescueBanner';
import { ThemedText } from '@/components/ui/ThemedText';
import { useBookmarks } from '@/features/bookmarks/useBookmarks';
import { useBookNotes } from '@/features/notes/useBookNotes';
import { usePageNotes } from '@/features/notes/usePageNotes';
import { usePdfReader } from '@/features/reader/usePdfReader';
import { useReaderBrightness } from '@/features/reader/useReaderBrightness';
import { useReaderPreferences } from '@/features/reader/useReaderPreferences';
import { useRescueMode } from '@/features/rescue/useRescueMode';
import { useRescueProgress } from '@/features/rescue/useRescueProgress';
import { useReadingSession } from '@/features/sessions/useReadingSession';
import { NoteError, NoteService } from '@/services/NoteService';
import type {
  SessionBlockerOption,
  SessionFocusOption,
  SessionMoodOption,
} from '@/types/session';
import { useTranslation } from '@/i18n/useTranslation';
import { Spacing } from '@/constants/layout';
import { useThemeColors } from '@/hooks/useColorScheme';

import { DEFAULT_READER_PREFERENCES } from '@/types/reader';

export default function ReaderScreen() {
  const { bookId } = useLocalSearchParams<{ bookId: string }>();
  const router = useRouter();
  const colors = useThemeColors();
  const { t } = useTranslation();
  const { preferences, saving: prefsSaving, updatePreferences } = useReaderPreferences();
  const readerPrefs = preferences ?? DEFAULT_READER_PREFERENCES;
  const { rescueMode, isRescueActive } = useRescueMode();
  const rescueStartPageRef = useRef<number>(1);
  const rescueCapturedRef = useRef(false);

  const {
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
    autoResumeStatus,
    showLoadingJumpHint,
    errorMessage,
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
  } = usePdfReader(bookId);

  useEffect(() => {
    if (state === 'ready' && isRescueActive && !rescueCapturedRef.current) {
      rescueStartPageRef.current = currentPage;
      rescueCapturedRef.current = true;
    }
    if (!isRescueActive) {
      rescueCapturedRef.current = false;
    }
  }, [state, isRescueActive, currentPage]);

  const rescueStartPage = rescueStartPageRef.current;

  const sessionEnabled = state === 'ready' && Boolean(bookId);

  const {
    elapsedSeconds,
    isPaused,
    finishModalVisible,
    saveSuccessMessage,
    saving,
    sessionSummary,
    openFinishModal,
    closeFinishModal,
    finishSession,
    autoSaveIfNeeded,
    clearSaveSuccess,
  } = useReadingSession({
    bookId,
    startPage: currentPage,
    currentPage,
    enabled: sessionEnabled,
  });

  const { bannerMessage: rescueBannerMessage, isRescueComplete } = useRescueProgress(
    rescueMode,
    rescueStartPage,
    currentPage,
    elapsedSeconds,
  );

  const {
    bookmarks,
    isPageBookmarked,
    toggleBookmark,
    deleteBookmark,
  } = useBookmarks(bookId);

  const { notes: bookNotes, deleteNote: deleteBookNote, refresh: refreshBookNotes } = useBookNotes(bookId);
  const { primaryNote, refresh: refreshPageNotes } = usePageNotes(bookId, currentPage);

  const [listsVisible, setListsVisible] = useState(false);
  const [comfortVisible, setComfortVisible] = useState(false);
  const [bookmarkListVisible, setBookmarkListVisible] = useState(false);
  const [notesListVisible, setNotesListVisible] = useState(false);
  const [noteEditorVisible, setNoteEditorVisible] = useState(false);
  const [noteEditorPage, setNoteEditorPage] = useState(currentPage);
  const [noteSaving, setNoteSaving] = useState(false);
  const [noteError, setNoteError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [focusMode, setFocusMode] = useState(false);
  const focusInitializedRef = useRef(false);

  useEffect(() => {
    if (state === 'ready' && readerPrefs.defaultFocusMode && !focusInitializedRef.current) {
      setFocusMode(true);
      focusInitializedRef.current = true;
    }
  }, [readerPrefs.defaultFocusMode, state]);

  const exitFocusMode = useCallback(() => {
    setFocusMode(false);
  }, []);

  const enterFocusMode = useCallback(() => {
    setFocusMode(true);
  }, []);

  useEffect(() => {
    if (!saveSuccessMessage) {
      return;
    }
    const timer = setTimeout(() => {
      clearSaveSuccess();
      router.replace('/(tabs)/library');
    }, 2500);
    return () => clearTimeout(timer);
  }, [clearSaveSuccess, router, saveSuccessMessage]);

  const handleBack = useCallback(() => {
    void (async () => {
      await autoSaveIfNeeded();
      router.back();
    })();
  }, [autoSaveIfNeeded, router]);

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (focusMode) {
        exitFocusMode();
        return true;
      }
      handleBack();
      return true;
    });
    return () => subscription.remove();
  }, [exitFocusMode, focusMode, handleBack]);

  const handleFinishSave = (details: {
    focus: SessionFocusOption | null;
    mood: SessionMoodOption | null;
    blocker: SessionBlockerOption | null;
  }) => {
    void (async () => {
      const result = await finishSession(details);
      if (!result) {
        Alert.alert(
          t('reader.sessionTooShort'),
          t('reader.sessionTooShortMessage'),
        );
        closeFinishModal();
      }
    })();
  };

  const handleBookmarkPress = () => {
    if (!bookId) {
      return;
    }
    const bookmarked = isPageBookmarked(currentPage);
    if (bookmarked) {
      Alert.alert(
        t('reader.removeBookmarkTitle'),
        t('reader.removeBookmarkMessage', { page: currentPage }),
        [
          { text: t('common.cancel'), style: 'cancel' },
          {
            text: t('reader.remove'),
            style: 'destructive',
            onPress: () => {
              void (async () => {
                await toggleBookmark(currentPage);
                setFeedback(t('reader.bookmarkRemoved', { page: currentPage }));
              })();
            },
          },
        ],
      );
      return;
    }
    void (async () => {
      await toggleBookmark(currentPage);
      setFeedback(t('reader.bookmarkAdded', { page: currentPage }));
    })();
  };

  const openNoteEditor = useCallback(
    (page: number) => {
      setNoteEditorPage(page);
      setNoteError(null);
      setNoteEditorVisible(true);
      void refreshPageNotes();
    },
    [refreshPageNotes],
  );

  const editorExistingNote =
    noteEditorPage === currentPage
      ? primaryNote
      : bookNotes.find((n) => n.pageNumber === noteEditorPage) ?? null;

  const handleSaveNote = (text: string) => {
    void (async () => {
      if (!bookId) {
        return;
      }
      try {
        setNoteSaving(true);
        setNoteError(null);
        await NoteService.savePageNote(bookId, noteEditorPage, text);
        await Promise.all([refreshPageNotes(), refreshBookNotes()]);
        setNoteEditorVisible(false);
        setFeedback(t('reader.noteSaved'));
      } catch (err) {
        setNoteError(err instanceof NoteError ? err.message : 'Could not save note.');
      } finally {
        setNoteSaving(false);
      }
    })();
  };

  const handleDeleteNote = () => {
    const note = editorExistingNote;
    if (!note) {
      return;
    }
    Alert.alert(t('reader.deleteNoteTitle'), t('reader.deleteNoteMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: () => {
          void (async () => {
            await deleteBookNote(note.id);
            await refreshPageNotes();
            setNoteEditorVisible(false);
            setFeedback(t('reader.noteDeleted'));
          })();
        },
      },
    ]);
  };

  const hasPageNote = bookNotes.some((n) => n.pageNumber === currentPage);

  const {
    errorKey: brightnessErrorKey,
    available: brightnessAvailable,
    applyNow,
    clearError: clearBrightnessError,
  } = useReaderBrightness(
    readerPrefs.brightnessEnabled,
    readerPrefs.brightnessValue,
    state === 'ready',
  );

  const handleComfortUpdate = useCallback(
    (patch: Partial<typeof readerPrefs>) => {
      void updatePreferences(patch);
    },
    [updatePreferences],
  );

  const handleBrightnessSlideComplete = useCallback(
    (value: number) => {
      if (readerPrefs.brightnessEnabled) {
        void applyNow(value);
      }
    },
    [applyNow, readerPrefs.brightnessEnabled],
  );

  useEffect(() => {
    if (state !== 'ready' || !readerPrefs.keepAwake) {
      return;
    }
    void activateKeepAwakeAsync('tin-pata-reader');
    return () => {
      deactivateKeepAwake('tin-pata-reader');
    };
  }, [readerPrefs.keepAwake, state]);

  useEffect(() => {
    return () => {
      deactivateKeepAwake('tin-pata-reader');
    };
  }, []);

  if (state === 'loading_book') {
    return (
      <SafeAreaView
        style={[styles.root, { backgroundColor: colors.background }]}
        edges={['top', 'left', 'right', 'bottom']}
      >
        <View style={styles.centered}>
          <ActivityIndicator color={colors.tint} size="large" />
          <ThemedText variant="caption" secondary>
            {t('reader.loadingBook')}
          </ThemedText>
        </View>
      </SafeAreaView>
    );
  }

  if (state === 'unsupported') {
    return (
      <SafeAreaView
        style={[styles.root, { backgroundColor: colors.background }]}
        edges={['top', 'left', 'right', 'bottom']}
      >
        <ReaderErrorView
          title={t('reader.devBuildRequired')}
          message={t('reader.devBuildMessage')}
          hint="Run: npx expo prebuild --clean --platform android && npx expo run:android"
          onBack={() => router.back()}
        />
      </SafeAreaView>
    );
  }

  if (state === 'error' || !book || !pdfUri) {
    return (
      <SafeAreaView
        style={[styles.root, { backgroundColor: colors.background }]}
        edges={['top', 'left', 'right', 'bottom']}
      >
        <ReaderErrorView
          title={t('reader.cannotOpenPdf')}
          message={errorMessage ?? t('reader.openError')}
          onBack={() => router.back()}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.root, { backgroundColor: colors.background }]}
      edges={focusMode ? ['top', 'left', 'right', 'bottom'] : ['top', 'left', 'right']}
    >
      <View style={styles.content}>
        {!focusMode ? (
          <PdfReaderToolbar
            title={book.title}
            currentPage={currentPage}
            totalPages={totalPages}
            elapsedSeconds={elapsedSeconds}
            timerPaused={isPaused}
            showTimer={readerPrefs.showTimer}
            showProgress={readerPrefs.showProgress}
            compact={readerPrefs.compactActions}
            onBack={handleBack}
          />
        ) : null}

        {feedback ? (
          <FeedbackBanner
            message={feedback}
            variant="success"
            onDismiss={() => setFeedback(null)}
          />
        ) : null}

        {brightnessErrorKey ? (
          <FeedbackBanner
            message={t(brightnessErrorKey)}
            variant="info"
            onDismiss={clearBrightnessError}
          />
        ) : null}

        {saveSuccessMessage ? (
          <FeedbackBanner message={saveSuccessMessage} variant="success" />
        ) : null}

        {showLoadingJumpHint ? (
          <FeedbackBanner
            message={t('reader.pdfStillLoading')}
            variant="info"
            onDismiss={clearLoadingJumpHint}
          />
        ) : null}

        {isRescueActive && rescueBannerMessage ? (
          <RescueBanner
            message={rescueBannerMessage}
            completed={isRescueComplete}
          />
        ) : null}

        {!isRescueActive &&
        savedPage > 1 &&
        (pdfLoading || autoResumeStatus === 'opening') ? (
          <FeedbackBanner
            message={t('reader.openingLastPage')}
            variant="info"
            autoDismissMs={0}
          />
        ) : null}

        {!isRescueActive && autoResumeStatus === 'resumed' && savedPage > 1 ? (
          <FeedbackBanner
            message={t('reader.resumedFromPage', { page: savedPage })}
            variant="success"
            autoDismissMs={0}
          />
        ) : null}

        {!isRescueActive && autoResumeStatus === 'fallback' && savedPage > 1 ? (
          <LastReadBanner
            message={t('reader.lastReadPage', { page: savedPage })}
            hint={t('reader.autoResumeUnavailable')}
            actionLabel={t('reader.goToSavedPage', { page: savedPage })}
            onGoToPage={goToSavedPage}
            onDismiss={dismissFallbackBanner}
          />
        ) : null}

        {pdfLoading && savedPage <= 1 ? (
          <View style={styles.pdfLoading} pointerEvents="none">
            <ActivityIndicator color={colors.tint} size="large" />
            <ThemedText variant="caption" secondary>
              {t('reader.loadingPdf')}
            </ThemedText>
          </View>
        ) : null}

        <ReaderPdfContent
          key={pdfUri}
          pdfRef={pdfRef}
          uri={pdfUri}
          initialPage={initialResumePage}
          fitPolicy={sessionFitPolicy}
          enablePaging={sessionEnablePaging}
          onLoadComplete={handlePdfLoadComplete}
          onPageChanged={handlePdfPageChanged}
          onError={handlePdfLoadError}
        />

      </View>

      {!focusMode ? (
        <ReaderActionBar
          isBookmarked={isPageBookmarked(currentPage)}
          hasPageNote={hasPageNote}
          compact={readerPrefs.compactActions}
          onBookmark={handleBookmarkPress}
          onNotes={() => openNoteEditor(currentPage)}
          onOpenLists={() => setListsVisible(true)}
          onOpenComfort={() => setComfortVisible(true)}
          onGoToPage={openGoToPage}
          onFinish={openFinishModal}
          onEnterFocus={enterFocusMode}
        />
      ) : null}

      <ReaderComfortModal
        visible={comfortVisible}
        preferences={readerPrefs}
        brightnessAvailable={brightnessAvailable}
        saving={prefsSaving}
        onClose={() => setComfortVisible(false)}
        onUpdate={handleComfortUpdate}
        onBrightnessSlideComplete={handleBrightnessSlideComplete}
      />

      <GoToPageModal
        visible={goToPageVisible}
        totalPages={totalPages}
        error={goToPageError}
        onClose={closeGoToPage}
        onSubmit={submitGoToPage}
      />

      <FinishSessionModal
        visible={finishModalVisible}
        saving={saving}
        startPage={sessionSummary.startPage}
        endPage={sessionSummary.endPage}
        pagesRead={sessionSummary.pagesRead}
        durationSeconds={sessionSummary.durationSeconds}
        onClose={closeFinishModal}
        onSave={handleFinishSave}
      />

      <ReaderListsModal
        visible={listsVisible}
        bookmarkCount={bookmarks.length}
        noteCount={bookNotes.length}
        onClose={() => setListsVisible(false)}
        onOpenBookmarks={() => setBookmarkListVisible(true)}
        onOpenNotes={() => setNotesListVisible(true)}
      />

      <BookmarkListModal
        visible={bookmarkListVisible}
        bookmarks={bookmarks}
        currentPage={currentPage}
        onClose={() => setBookmarkListVisible(false)}
        onSelectPage={jumpToPage}
        onDelete={(id) => {
          void deleteBookmark(id);
        }}
      />

      <NotesListModal
        visible={notesListVisible}
        notes={bookNotes}
        currentPage={currentPage}
        onClose={() => setNotesListVisible(false)}
        onSelectPage={jumpToPage}
        onEditPage={(page) => {
          setNotesListVisible(false);
          openNoteEditor(page);
        }}
        onDelete={(id) => {
          void deleteBookNote(id);
        }}
      />

      <NoteEditorModal
        visible={noteEditorVisible}
        pageNumber={noteEditorPage}
        existingNote={editorExistingNote}
        saving={noteSaving}
        error={noteError}
        onClose={() => setNoteEditorVisible(false)}
        onSave={handleSaveNote}
        onDelete={editorExistingNote ? handleDeleteNote : undefined}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  content: {
    flex: 1,
    minHeight: 0,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  pdfLoading: {
    position: 'absolute',
    top: '40%',
    alignSelf: 'center',
    alignItems: 'center',
    gap: Spacing.sm,
    zIndex: 2,
  },
});
