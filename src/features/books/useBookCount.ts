import { useCallback, useState } from 'react';
import { Platform } from 'react-native';
import { useFocusEffect } from 'expo-router';

import { BookRepository } from '@/db/repositories/BookRepository';

export function useBookCount() {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (Platform.OS === 'web') {
      setCount(0);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const total = await BookRepository.count();
      setCount(total);
    } catch {
      setCount(0);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  return { count, loading, hasBooks: count > 0, refresh };
}
