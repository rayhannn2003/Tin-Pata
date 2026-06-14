import { useMemo } from 'react';
import { useLocalSearchParams } from 'expo-router';

import type { RescueModeParams, RescueModeType } from '@/types/rescue';

export function useRescueMode() {
  const params = useLocalSearchParams<{
    mode?: string;
    rescueType?: string;
    pageTarget?: string;
    minuteTarget?: string;
  }>();

  const rescueMode = useMemo((): RescueModeParams | null => {
    if (params.mode !== 'rescue') {
      return null;
    }
    const rescueType = params.rescueType as RescueModeType | undefined;
    if (rescueType !== 'one_page' && rescueType !== 'three_minutes') {
      return null;
    }
    return {
      mode: 'rescue',
      rescueType,
      pageTarget: params.pageTarget ? Number(params.pageTarget) : undefined,
      minuteTarget: params.minuteTarget ? Number(params.minuteTarget) : undefined,
    };
  }, [params.mode, params.minuteTarget, params.pageTarget, params.rescueType]);

  const bannerMessage = useMemo(() => {
    if (!rescueMode) {
      return null;
    }
    if (rescueMode.rescueType === 'one_page') {
      return 'Rescue mode: read only 1 page. Small progress counts.';
    }
    return 'Rescue mode: read for 3 minutes. No pressure.';
  }, [rescueMode]);

  return { rescueMode, bannerMessage, isRescueActive: rescueMode !== null };
}
