'use client';

import { useAuth } from '@/hooks/useAuth';
import { SyncStatus } from '@/components/dashboard/SyncStatus';
import { UserMenu } from '@/components/dashboard/UserMenu';
import {
  formatTopbarDate,
  getDisplayNameFromEmail,
  getGreeting,
} from '@/utils/dashboard';

interface TopbarProps {
  onOpenSidebar: () => void;
}

export function Topbar({ onOpenSidebar }: TopbarProps) {
  const { user } = useAuth();
  const name = getDisplayNameFromEmail(user?.email);
  const greeting = `${getGreeting()}, ${name}`;

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-surface/95 backdrop-blur-sm">
      <div className="flex items-center justify-between gap-4 px-4 py-3 md:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={onOpenSidebar}
            className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-border text-foreground outline-none hover:bg-tint-muted focus-visible:ring-2 focus-visible:ring-tint/40 lg:hidden"
            aria-label="Open navigation menu"
          >
            <span className="sr-only">Open menu</span>
            <span aria-hidden className="flex flex-col gap-1.5">
              <span className="block h-0.5 w-5 bg-current" />
              <span className="block h-0.5 w-5 bg-current" />
              <span className="block h-0.5 w-5 bg-current" />
            </span>
          </button>
          <div className="min-w-0">
            <p className="truncate text-base font-semibold text-foreground md:text-lg">{greeting}</p>
            <p className="truncate text-xs text-muted md:text-sm">{formatTopbarDate()}</p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <SyncStatus status="synced" className="hidden sm:inline-flex" />
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-border text-muted outline-none hover:bg-tint-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-tint/40"
            aria-label="Notifications (coming soon)"
            disabled
            title="Notifications coming soon"
          >
            <span aria-hidden className="text-lg leading-none">
              ◯
            </span>
          </button>
          <UserMenu variant="topbar" />
        </div>
      </div>
    </header>
  );
}
