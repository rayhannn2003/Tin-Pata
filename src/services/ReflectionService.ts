import { ReflectionRepository } from '@/db/repositories/ReflectionRepository';
import type { Reflection } from '@/types';

export const ReflectionService = {
  async getAllReflections(): Promise<Reflection[]> {
    return ReflectionRepository.getAll();
  },

  async deleteReflection(id: string): Promise<void> {
    await ReflectionRepository.deleteReflection(id);
  },
};
