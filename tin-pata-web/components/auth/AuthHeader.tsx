import Link from 'next/link';

import { brand } from '@/styles/theme';
import { ROUTES } from '@/utils/constants';

interface AuthHeaderProps {
  title: string;
  subtitle?: string;
}

export function AuthHeader({ title, subtitle }: AuthHeaderProps) {
  return (
    <div className="mb-6 flex flex-col gap-2 text-center">
      <Link href={ROUTES.home} className="text-sm font-medium text-tint hover:underline">
        {brand.displayName}
      </Link>
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
      {subtitle ? <p className="text-sm text-muted">{subtitle}</p> : null}
    </div>
  );
}
