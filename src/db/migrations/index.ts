import { MIGRATION_V1 } from '@/db/migrations/001_initial';
import { MIGRATION_V2 } from '@/db/migrations/002_goal_sessions_type';
import { MIGRATION_V3 } from '@/db/migrations/003_reflections';

import { MIGRATION_V4 } from '@/db/migrations/004_book_organization';
import { MIGRATION_V5 } from '@/db/migrations/005_sync_metadata';
import { MIGRATION_V6 } from '@/db/migrations/006_sync_queue';
import { MIGRATION_V7 } from '@/db/migrations/007_pdf_cloud_fields';

export const MIGRATIONS: { version: number; sql: string }[] = [
  { version: 1, sql: MIGRATION_V1 },
  { version: 2, sql: MIGRATION_V2 },
  { version: 3, sql: MIGRATION_V3 },
  { version: 4, sql: MIGRATION_V4 },
  { version: 5, sql: MIGRATION_V5 },
  { version: 6, sql: MIGRATION_V6 },
  { version: 7, sql: MIGRATION_V7 },
];
