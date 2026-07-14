'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

import { useAuth } from '@/hooks/useAuth';
import { ROUTES } from '@/utils/constants';

function initialsFromEmail(email: string | null | undefined): string {
  if (!email) {
    return '?';
  }
  return email.charAt(0).toUpperCase();
}

export function UserMenu() {
  const { user, signOut, loading } = useAuth();
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
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

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-full border border-border bg-surface px-2 py-1.5 text-sm hover:bg-tint-muted"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <span
          className="flex h-8 w-8 items-center justify-center rounded-full bg-tint text-sm font-semibold text-white"
          aria-hidden
        >
          {initialsFromEmail(user.email)}
        </span>
        <span className="hidden max-w-[10rem] truncate text-foreground sm:inline">
          {user.email}
        </span>
      </button>

      {open ? (
        <div
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
            className="block rounded-md px-3 py-2 text-sm text-foreground hover:bg-tint-muted"
          >
            Settings
          </Link>
          <button
            role="menuitem"
            type="button"
            disabled={signingOut}
            onClick={() => void handleSignOut()}
            className="w-full rounded-md px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 disabled:opacity-60 dark:hover:bg-red-950/30"
          >
            {signingOut ? 'Signing out…' : 'Log out'}
          </button>
        </div>
      ) : null}
    </div>
  );
}
