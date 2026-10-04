/** Book cover image path (Supabase Storage user-covers). */
export const MIGRATION_V8 = `
ALTER TABLE books ADD COLUMN cover_image_path TEXT;
`;
