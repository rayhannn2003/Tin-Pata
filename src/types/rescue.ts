import type { Book } from '@/types';

export type RescueModeType = 'one_page' | 'three_minutes';

export interface RescueModeParams {
  mode: 'rescue';
  rescueType: RescueModeType;
  pageTarget?: number;
  minuteTarget?: number;
}

export interface RescueOption {
  id: 'one_page' | 'three_minutes' | 'continue' | 'reflect';
  label: string;
  description: string;
}

export interface RescueStartResult {
  book: Book;
  route: string;
}
