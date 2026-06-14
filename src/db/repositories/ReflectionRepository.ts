import { getDatabase } from '@/db/database';
import type { Reflection } from '@/types';

interface ReflectionRow {
  id: string;
  text: string;
  book_id: string | null;
  created_at: string;
}

function mapRow(row: ReflectionRow): Reflection {
  return {
    id: row.id,
    text: row.text,
    bookId: row.book_id,
    createdAt: row.created_at,
  };
}

export const ReflectionRepository = {
  async createReflection(reflection: Reflection): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      'INSERT INTO reflections (id, text, book_id, created_at) VALUES (?, ?, ?, ?)',
      reflection.id,
      reflection.text,
      reflection.bookId,
      reflection.createdAt,
    );
  },

  async getRecent(limit = 10): Promise<Reflection[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<ReflectionRow>(
      'SELECT * FROM reflections ORDER BY created_at DESC LIMIT ?',
      limit,
    );
    return rows.map(mapRow);
  },

  async getAll(): Promise<Reflection[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<ReflectionRow>(
      'SELECT * FROM reflections ORDER BY created_at DESC',
    );
    return rows.map(mapRow);
  },

  async deleteReflection(id: string): Promise<void> {
    const db = await getDatabase();
    await db.runAsync('DELETE FROM reflections WHERE id = ?', id);
  },
};
