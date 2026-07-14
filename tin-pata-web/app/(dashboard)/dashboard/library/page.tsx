import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { LibraryClient } from '@/components/library/LibraryClient';
import { BookService } from '@/services/BookService';

export default async function LibraryPage() {
  const books = await BookService.listForCurrentUser();

  return (
    <div className="mx-auto max-w-6xl">
      <DashboardHeader
        title="Library"
        description="Browse and manage your synced books. Search, filter, and open details — the web reader comes later."
      />
      <LibraryClient books={books} />
    </div>
  );
}
