import { Card } from '@/components/ui/Card';
import { PageContainer } from '@/components/ui/PageContainer';
import { PageTitle } from '@/components/ui/PageTitle';

interface PlaceholderPageProps {
  title: string;
  description?: string;
}

export function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <PageContainer>
      <PageTitle
        title={title}
        description={description ?? 'Placeholder — architecture scaffold only (v2.1A).'}
      />
      <Card muted>
        <p className="text-sm text-muted">
          This route is prepared. Business logic ships in a later phase.
        </p>
      </Card>
    </PageContainer>
  );
}
