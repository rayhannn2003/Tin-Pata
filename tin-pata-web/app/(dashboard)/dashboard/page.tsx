import { DashboardEmptyState } from '@/components/dashboard/EmptyState';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { SectionCard } from '@/components/dashboard/SectionCard';
import { StatCard } from '@/components/dashboard/StatCard';

export default function DashboardHomePage() {
  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <DashboardHeader
        title="Dashboard"
        description="Your reading overview will live here. Cards below are placeholders for upcoming data."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Reading goal" value="—" hint="Daily target (coming soon)" />
        <StatCard label="Weekly reading" value="—" hint="Minutes and pages" />
        <StatCard label="Current streak" value="—" hint="Days in a row" />
        <StatCard label="Books in progress" value="—" hint="From your library" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard title="Continue reading" description="Pick up where you left off.">
          <DashboardEmptyState
            title="No book in progress yet"
            description="When you sync or import books, your latest title will appear here."
            actionLabel="Library coming in a later phase"
          />
        </SectionCard>

        <SectionCard title="Recent books" description="What you’ve opened lately.">
          <DashboardEmptyState
            title="No recent books"
            description="Recently read titles will show up after library sync."
          />
        </SectionCard>

        <SectionCard title="Recent notes" description="Thoughts from your reading.">
          <DashboardEmptyState
            title="No notes yet"
            description="Notes you capture while reading will list here."
          />
        </SectionCard>

        <SectionCard title="Recent bookmarks" description="Pages you marked.">
          <DashboardEmptyState
            title="No bookmarks yet"
            description="Bookmarks from the reader will appear in this section."
          />
        </SectionCard>
      </div>
    </div>
  );
}
