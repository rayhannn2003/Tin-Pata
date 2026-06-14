import { useEffect, useRef, useState } from 'react';

import { ReaderBrightnessService } from '@/services/ReaderBrightnessService';

export function useReaderBrightness(enabled: boolean, value: number, active: boolean) {
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const [available, setAvailable] = useState(false);
  const restoreAttemptedRef = useRef(false);

  useEffect(() => {
    void ReaderBrightnessService.isAvailable().then(setAvailable);
  }, []);

  useEffect(() => {
    if (!active || !enabled || !available) {
      return;
    }

    let cancelled = false;
    restoreAttemptedRef.current = false;

    void (async () => {
      const result = await ReaderBrightnessService.applyReaderBrightness(value);
      if (cancelled) {
        return;
      }
      setErrorKey(result.ok ? null : (result.errorKey ?? 'reader.brightnessApplyFailed'));
    })();

    return () => {
      cancelled = true;
      if (restoreAttemptedRef.current) {
        return;
      }
      restoreAttemptedRef.current = true;
      void (async () => {
        const result = await ReaderBrightnessService.restoreReaderBrightness();
        if (!result.ok && enabled) {
          setErrorKey(result.errorKey ?? 'reader.brightnessRestoreFailed');
        }
      })();
    };
  }, [active, available, enabled, value]);

  const applyNow = async (nextValue: number) => {
    if (!enabled || !available) {
      return;
    }
    const result = await ReaderBrightnessService.applyReaderBrightness(nextValue);
    setErrorKey(result.ok ? null : (result.errorKey ?? 'reader.brightnessApplyFailed'));
  };

  return { errorKey, available, applyNow, clearError: () => setErrorKey(null) };
};
