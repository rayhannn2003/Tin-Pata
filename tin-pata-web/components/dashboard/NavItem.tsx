'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavItemProps {
  href: string;
  label: string;
  match?: 'exact' | 'prefix';
  onNavigate?: () => void;
}

export function NavItem({ href, label, match = 'prefix', onNavigate }: NavItemProps) {
  const pathname = usePathname();
  const active =
    match === 'exact' ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      onClick={onNavigate}
      aria-current={active ? 'page' : undefined}
      className={`block rounded-md px-3 py-2 text-sm font-medium outline-none transition focus-visible:ring-2 focus-visible:ring-tint/40 ${
        active
          ? 'bg-tint-muted text-foreground'
          : 'text-muted hover:bg-tint-muted/60 hover:text-foreground'
      }`}
    >
      {label}
    </Link>
  );
}
