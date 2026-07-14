import { DashboardEmptyState } from '@/components/dashboard/EmptyState';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { SectionCard } from '@/components/dashboard/SectionCard';

export default function AnalyticsPage() {
  return (
    <div className="mx-auto max-w-6xl">
      <DashboardHeader
        title="Analytics"
        description="Streaks, weekly charts, and insights will live on this page."
      />
      <SectionCard title="Reading insights">
        <DashboardEmptyState
          title="No analytics yet"
          description="Charts and trends will use the same Supabase data as the mobile app."
        />
      </SectionCard>
    </div>
  );
}
