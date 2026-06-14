import { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';

import { SettingsRepository } from '@/db/repositories/SettingsRepository';

const ONBOARDING_KEY = 'has_seen_onboarding';

export function useOnboarding() {
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(true);

  const check = useCallback(async () => {
    if (Platform.OS === 'web') {
      setVisible(false);
      setLoading(false);
      return;
    }
    try {
      const value = await SettingsRepository.get(ONBOARDING_KEY);
      setVisible(value !== 'true');
    } catch {
      setVisible(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void check();
  }, [check]);

  const complete = useCallback(async () => {
    await SettingsRepository.set(ONBOARDING_KEY, 'true');
    setVisible(false);
  }, []);

  const skip = useCallback(async () => {
    await complete();
  }, [complete]);

  return { visible, loading, complete, skip };
}
