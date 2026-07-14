import Link from 'next/link';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { PageContainer } from '@/components/ui/PageContainer';
import { PageTitle } from '@/components/ui/PageTitle';
import { brand } from '@/styles/theme';
import { ROUTES } from '@/utils/constants';

export default function HomePage() {
  return (
    <PageContainer>
      <PageTitle
        title={brand.displayName}
        description="Web client for your reading life — same Supabase account as the Android app."
      />
      <Card>
        <p className="mb-6 text-sm text-muted">
          Sign in to open your dashboard. Library and reading features arrive in later phases.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link href={ROUTES.signIn}>
            <Button>Sign in</Button>
          </Link>
          <Link href={ROUTES.signUp}>
            <Button variant="secondary">Sign up</Button>
          </Link>
        </div>
      </Card>
    </PageContainer>
  );
}
