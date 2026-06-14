import { MIGRATION_V1 } from '@/db/migrations/001_initial';
import { MIGRATION_V2 } from '@/db/migrations/002_goal_sessions_type';
import { MIGRATION_V3 } from '@/db/migrations/003_reflections';

export const MIGRATIONS: { version: number; sql: string }[] = [
  { version: 1, sql: MIGRATION_V1 },
  { version: 2, sql: MIGRATION_V2 },
  { version: 3, sql: MIGRATION_V3 },
];
