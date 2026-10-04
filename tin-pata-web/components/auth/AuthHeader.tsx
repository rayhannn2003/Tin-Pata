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
      <Link href={ROUTES.home} className="mx-auto flex flex-col items-center gap-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-icon.png" alt="" width={48} height={48} className="h-12 w-12 rounded-xl" />
        <span className="text-sm font-medium text-tint hover:underline">{brand.displayName}</span>
      </Link>
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
      {subtitle ? <p className="text-sm text-muted">{subtitle}</p> : null}
    </div>
  );
}
