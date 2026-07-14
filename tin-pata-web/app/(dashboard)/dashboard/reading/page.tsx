import Link from 'next/link';

import { DashboardEmptyState } from '@/components/dashboard/EmptyState';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { SectionCard } from '@/components/dashboard/SectionCard';
import { ROUTES } from '@/utils/constants';

export default function ReadingPage() {
  return (
    <div className="mx-auto max-w-6xl">
      <DashboardHeader
        title="Reading"
        description="Open a book from your library to continue in the web reader."
      />
      <SectionCard title="Continue reading">
        <DashboardEmptyState
          title="Pick a book from your library"
          description="The PDF reader opens at /dashboard/reader/[bookId] and resumes your last page."
        />
        <div className="mt-4">
          <Link
            href={ROUTES.library}
            className="inline-flex rounded-md bg-tint px-4 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            Go to library
          </Link>
        </div>
      </SectionCard>
    </div>
  );
}
