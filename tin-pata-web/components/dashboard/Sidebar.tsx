'use client';

import Link from 'next/link';

import { NavItem } from '@/components/dashboard/NavItem';
import { SyncStatus } from '@/components/dashboard/SyncStatus';
import { UserMenu } from '@/components/dashboard/UserMenu';
import { brand } from '@/styles/theme';
import { DASHBOARD_NAV, ROUTES } from '@/utils/constants';

interface SidebarProps {
  onNavigate?: () => void;
  className?: string;
}

export function Sidebar({ onNavigate, className = '' }: SidebarProps) {
  return (
    <aside
      className={`flex h-full w-64 flex-col border-r border-border bg-surface ${className}`}
      aria-label="Main navigation"
    >
      <div className="border-b border-border px-4 py-5">
        <Link
          href={ROUTES.dashboard}
          onClick={onNavigate}
          className="flex items-center gap-3 outline-none focus-visible:ring-2 focus-visible:ring-tint/40"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo-icon.png"
            alt=""
            width={40}
            height={40}
            className="h-10 w-10 rounded-lg"
          />
          <span>
            <p className="text-lg font-semibold text-tint">{brand.nameBn}</p>
            <p className="text-xs text-muted">{brand.nameEn}</p>
          </span>
        </Link>
      </div>

      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3" aria-label="Dashboard">
        {DASHBOARD_NAV.map((item) => (
          <NavItem
            key={item.href}
            href={item.href}
            label={item.label}
            match={item.match}
            onNavigate={onNavigate}
          />
        ))}
      </nav>

      <div className="mt-auto space-y-4 border-t border-border p-4">
        <SyncStatus status="synced" />
        <UserMenu variant="sidebar" showLogoutButton />
      </div>
    </aside>
  );
}
