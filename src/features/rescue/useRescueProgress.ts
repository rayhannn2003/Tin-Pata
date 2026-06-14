import { useEffect, useMemo, useState } from 'react';

import { useTranslation } from '@/i18n/useTranslation';
import type { RescueModeParams } from '@/types/rescue';
import { formatDurationSeconds } from '@/utils/date';

const DEFAULT_MINUTE_TARGET = 3;

export function useRescueProgress(
  rescueMode: RescueModeParams | null,
  rescueStartPage: number,
  currentPage: number,
  elapsedSeconds: number,
) {
  const { t } = useTranslation();
  const [onePageComplete, setOnePageComplete] = useState(false);
  const [threeMinComplete, setThreeMinComplete] = useState(false);

  const minuteTarget = rescueMode?.minuteTarget ?? DEFAULT_MINUTE_TARGET;
  const targetSeconds = minuteTarget * 60;

  useEffect(() => {
    if (rescueMode?.rescueType !== 'one_page') {
      setOnePageComplete(false);
      return;
    }
    if (currentPage >= rescueStartPage + 1) {
      setOnePageComplete(true);
    }
  }, [rescueMode, rescueStartPage, currentPage]);

  useEffect(() => {
    if (rescueMode?.rescueType !== 'three_minutes') {
      setThreeMinComplete(false);
      return;
    }
    if (elapsedSeconds >= targetSeconds) {
      setThreeMinComplete(true);
    }
  }, [rescueMode, elapsedSeconds, targetSeconds]);

  const remainingSeconds = Math.max(0, targetSeconds - elapsedSeconds);

  const bannerMessage = useMemo(() => {
    if (!rescueMode) {
      return null;
    }
    if (rescueMode.rescueType === 'one_page') {
      if (onePageComplete) {
        return t('rescue.bannerDone');
      }
      return t('rescue.bannerOnePage');
    }
    if (threeMinComplete) {
      return t('rescue.bannerThreeMin');
    }
    return t('rescue.bannerTimeLeft', { time: formatDurationSeconds(remainingSeconds) });
  }, [onePageComplete, remainingSeconds, rescueMode, t, threeMinComplete]);

  const isRescueComplete = onePageComplete || threeMinComplete;

  return {
    bannerMessage,
    onePageComplete,
    threeMinComplete,
    isRescueComplete,
    remainingSeconds,
  };
}
