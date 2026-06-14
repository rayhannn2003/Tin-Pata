import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

import { ReadingSessionService } from '@/services/ReadingSessionService';
import type {
  ActiveReadingSession,
  FinishSessionInput,
  SessionSaveResult,
} from '@/types/session';

interface UseReadingSessionOptions {
  bookId: string | undefined;
  startPage: number;
  currentPage: number;
  enabled: boolean;
}

interface FinishSessionDetails {
  focus?: FinishSessionInput['focus'];
  mood?: FinishSessionInput['mood'];
  blocker?: FinishSessionInput['blocker'];
}

export function useReadingSession({
  bookId,
  startPage,
  currentPage,
  enabled,
}: UseReadingSessionOptions) {
  const sessionRef = useRef<ActiveReadingSession | null>(null);
  const savedRef = useRef(false);
  const accumulatedMsRef = useRef(0);
  const segmentStartRef = useRef<number | null>(null);
  const isPausedRef = useRef(false);

  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [finishModalVisible, setFinishModalVisible] = useState(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const computeElapsedMs = useCallback(() => {
    let ms = accumulatedMsRef.current;
    if (segmentStartRef.current != null && !isPausedRef.current) {
      ms += Date.now() - segmentStartRef.current;
    }
    return ms;
  }, []);

  const syncElapsed = useCallback(() => {
    const seconds = Math.max(0, Math.floor(computeElapsedMs() / 1000));
    setElapsedSeconds(seconds);
    return seconds;
  }, [computeElapsedMs]);

  const pauseTimer = useCallback(() => {
    if (isPausedRef.current || segmentStartRef.current == null) {
      return;
    }
    accumulatedMsRef.current += Date.now() - segmentStartRef.current;
    segmentStartRef.current = null;
    isPausedRef.current = true;
    setIsPaused(true);
    syncElapsed();
  }, [syncElapsed]);

  const resumeTimer = useCallback(() => {
    if (!isPausedRef.current || !enabled) {
      return;
    }
    segmentStartRef.current = Date.now();
    isPausedRef.current = false;
    setIsPaused(false);
  }, [enabled]);

  const getDurationSeconds = useCallback((): number => {
    return Math.max(0, Math.floor(computeElapsedMs() / 1000));
  }, [computeElapsedMs]);

  useEffect(() => {
    if (!enabled || !bookId) {
      return;
    }

    sessionRef.current = ReadingSessionService.startSession(bookId, startPage);
    savedRef.current = false;
    accumulatedMsRef.current = 0;
    segmentStartRef.current = Date.now();
    isPausedRef.current = false;
    setIsPaused(false);
    setElapsedSeconds(0);
    setSaveSuccessMessage(null);

    return () => {
      segmentStartRef.current = null;
      isPausedRef.current = true;
    };
  }, [bookId, enabled, startPage]);

  useEffect(() => {
    if (sessionRef.current) {
      sessionRef.current.currentPage = currentPage;
    }
  }, [currentPage]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const interval = setInterval(() => {
      if (!isPausedRef.current) {
        syncElapsed();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [enabled, syncElapsed]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const handleAppState = (nextState: AppStateStatus) => {
      if (nextState === 'active') {
        resumeTimer();
      } else if (nextState === 'background' || nextState === 'inactive') {
        pauseTimer();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppState);
    return () => subscription.remove();
  }, [enabled, pauseTimer, resumeTimer]);

  const persistSession = useCallback(
    async (details?: FinishSessionDetails): Promise<SessionSaveResult | null> => {
      if (savedRef.current || !sessionRef.current || !bookId) {
        return null;
      }

      const session = sessionRef.current;
      const durationSeconds = getDurationSeconds();
      const endPage = session.currentPage;
      const pagesRead = ReadingSessionService.calculatePagesRead(
        session.startPage,
        endPage,
      );

      if (!ReadingSessionService.shouldSaveSession(durationSeconds, pagesRead)) {
        return null;
      }

      savedRef.current = true;
      sessionRef.current.isActive = false;
      pauseTimer();

      const result = await ReadingSessionService.finishSession({
        bookId,
        startPage: session.startPage,
        endPage,
        durationSeconds,
        focus: details?.focus ?? null,
        mood: details?.mood ?? null,
        blocker: details?.blocker ?? null,
      });

      return result;
    },
    [bookId, getDurationSeconds, pauseTimer],
  );

  const autoSaveIfNeeded = useCallback(async (): Promise<SessionSaveResult | null> => {
    try {
      return await persistSession();
    } catch {
      return null;
    }
  }, [persistSession]);

  const autoSaveRef = useRef(autoSaveIfNeeded);
  autoSaveRef.current = autoSaveIfNeeded;

  useEffect(() => {
    if (!enabled) {
      return;
    }

    return () => {
      void autoSaveRef.current();
    };
  }, [enabled]);

  const openFinishModal = useCallback(() => {
    syncElapsed();
    setFinishModalVisible(true);
  }, [syncElapsed]);

  const closeFinishModal = useCallback(() => {
    if (!saving) {
      setFinishModalVisible(false);
    }
  }, [saving]);

  const finishSession = useCallback(
    async (details: FinishSessionDetails): Promise<SessionSaveResult | null> => {
      try {
        setSaving(true);
        const result = await persistSession(details);
        if (result) {
          setSaveSuccessMessage(ReadingSessionService.formatSaveSuccessMessage(result));
        }
        setFinishModalVisible(false);
        return result;
      } catch {
        return null;
      } finally {
        setSaving(false);
      }
    },
    [persistSession],
  );

  const clearSaveSuccess = useCallback(() => {
    setSaveSuccessMessage(null);
  }, []);

  const sessionSummary = {
    startPage: sessionRef.current?.startPage ?? startPage,
    endPage: currentPage,
    pagesRead: ReadingSessionService.calculatePagesRead(
      sessionRef.current?.startPage ?? startPage,
      currentPage,
    ),
    durationSeconds: elapsedSeconds,
  };

  return {
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
  };
}
