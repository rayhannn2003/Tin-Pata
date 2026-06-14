import { useCallback, useState } from 'react';
import { Platform } from 'react-native';
import { useFocusEffect } from 'expo-router';

import { ReflectionService } from '@/services/ReflectionService';
import type { Reflection } from '@/types';

export function useReflections() {
  const [reflections, setReflections] = useState<Reflection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (Platform.OS === 'web') {
      setReflections([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const data = await ReflectionService.getAllReflections();
      setReflections(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load reflections.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  const deleteReflection = useCallback(
    async (id: string) => {
      await ReflectionService.deleteReflection(id);
      await refresh();
    },
    [refresh],
  );

  return { reflections, loading, error, refresh, deleteReflection };
}
