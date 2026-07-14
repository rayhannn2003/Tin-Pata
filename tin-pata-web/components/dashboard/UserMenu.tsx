'use client';

import Link from 'next/link';
import { useEffect, useId, useRef, useState } from 'react';

import { useAuth } from '@/hooks/useAuth';
import { initialsFromEmail } from '@/utils/dashboard';
import { ROUTES } from '@/utils/constants';

interface UserMenuProps {
  /** Stack avatar above email (sidebar). */
  variant?: 'topbar' | 'sidebar';
  showLogoutButton?: boolean;
}

export function UserMenu({ variant = 'topbar', showLogoutButton = false }: UserMenuProps) {
  const { user, signOut, loading } = useAuth();
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  if (loading || !user) {
    return null;
  }

  const handleSignOut = async () => {
    try {
      setSigningOut(true);
      setOpen(false);
      await signOut();
    } finally {
      setSigningOut(false);
    }
  };

  const avatar = (
    <span
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-tint text-sm font-semibold text-white"
      aria-hidden
    >
      {initialsFromEmail(user.email)}
    </span>
  );

  if (variant === 'sidebar') {
    return (
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3 px-2">
          {avatar}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">{user.email}</p>
            <p className="text-xs text-muted">Account</p>
          </div>
        </div>
        {showLogoutButton ? (
          <button
            type="button"
            disabled={signingOut}
            onClick={() => void handleSignOut()}
            className="rounded-md px-3 py-2 text-left text-sm text-red-600 outline-none hover:bg-red-50 focus-visible:ring-2 focus-visible:ring-tint/40 disabled:opacity-60 dark:hover:bg-red-950/30"
          >
            {signingOut ? 'Signing out…' : 'Log out'}
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-full border border-border bg-surface px-2 py-1.5 text-sm outline-none hover:bg-tint-muted focus-visible:ring-2 focus-visible:ring-tint/40"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls={menuId}
      >
        {avatar}
        <span className="hidden max-w-[10rem] truncate text-foreground lg:inline">{user.email}</span>
      </button>

      {open ? (
        <div
          id={menuId}
          role="menu"
          className="absolute right-0 z-50 mt-2 w-56 rounded-lg border border-border bg-surface p-1 shadow-md"
        >
          <div className="border-b border-border px-3 py-2">
            <p className="truncate text-xs text-muted">Signed in as</p>
            <p className="truncate text-sm font-medium text-foreground">{user.email}</p>
          </div>
          <Link
            role="menuitem"
            href={ROUTES.settings}
            onClick={() => setOpen(false)}
            className="block rounded-md px-3 py-2 text-sm text-foreground outline-none hover:bg-tint-muted focus-visible:ring-2 focus-visible:ring-tint/40"
          >
            Settings
          </Link>
          <button
            role="menuitem"
            type="button"
            disabled={signingOut}
            onClick={() => void handleSignOut()}
            className="w-full rounded-md px-3 py-2 text-left text-sm text-red-600 outline-none hover:bg-red-50 focus-visible:ring-2 focus-visible:ring-tint/40 disabled:opacity-60 dark:hover:bg-red-950/30"
          >
            {signingOut ? 'Signing out…' : 'Log out'}
          </button>
        </div>
      ) : null}
    </div>
  );
}
