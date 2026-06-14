import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';

import { ReaderPreferencesService } from '@/services/ReaderPreferencesService';
import type { ReaderPreferences } from '@/types/reader';

export function useReaderPreferences() {
  const [preferences, setPreferences] = useState<ReaderPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const prefs = await ReaderPreferencesService.getPreferences();
      setPreferences(prefs);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  const updatePreferences = useCallback(async (patch: Partial<ReaderPreferences>) => {
    try {
      setSaving(true);
      const next = await ReaderPreferencesService.updatePreferences(patch);
      setPreferences(next);
      return next;
    } finally {
      setSaving(false);
    }
  }, []);

  return {
    preferences,
    loading,
    saving,
    refresh,
    updatePreferences,
  };
}
