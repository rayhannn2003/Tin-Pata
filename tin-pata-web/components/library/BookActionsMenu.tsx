'use client';

import { useEffect, useId, useRef, useState, useTransition, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';

import {
  deleteBookAction,
  renameBookAction,
  updateBookStatusAction,
} from '@/app/(dashboard)/dashboard/library/actions';
import { BOOK_STATUSES, formatStatusLabel, type BookStatus } from '@/types/book';
import { ROUTES } from '@/utils/constants';

interface BookActionsMenuProps {
  bookId: string;
  title: string;
  status: BookStatus;
  onDeleted?: () => void;
  /** When true, navigate to library after a successful soft delete. */
  redirectToLibraryOnDelete?: boolean;
}

export function BookActionsMenu({
  bookId,
  title,
  status,
  onDeleted,
  redirectToLibraryOnDelete = false,
}: BookActionsMenuProps) {
  const router = useRouter();
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setStatusOpen(false);
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false);
        setStatusOpen(false);
      }
    }
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  function refresh() {
    router.refresh();
  }

  function handleRename() {
    setOpen(false);
    const next = window.prompt('Rename book', title);
    if (next == null || next.trim() === title) {
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await renameBookAction(bookId, next);
      if (!result.ok) {
        setError(result.error ?? 'Could not rename.');
        return;
      }
      refresh();
    });
  }

  function handleStatus(next: BookStatus) {
    setStatusOpen(false);
    setOpen(false);
    if (next === status) {
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await updateBookStatusAction(bookId, next);
      if (!result.ok) {
        setError(result.error ?? 'Could not update status.');
        return;
      }
      refresh();
    });
  }

  function handleDelete() {
    setOpen(false);
    const confirmed = window.confirm(
      `Delete “${title}”? This removes it from your web library (soft delete).`,
    );
    if (!confirmed) {
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await deleteBookAction(bookId);
      if (!result.ok) {
        setError(result.error ?? 'Could not delete.');
        return;
      }
      onDeleted?.();
      if (redirectToLibraryOnDelete) {
        router.push(ROUTES.library);
        return;
      }
      refresh();
    });
  }

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted hover:bg-tint-muted hover:text-foreground disabled:opacity-60"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={`Actions for ${title}`}
        disabled={pending}
        onClick={() => {
          setOpen((value) => !value);
          setStatusOpen(false);
        }}
      >
        <span aria-hidden className="text-lg leading-none">
          ⋯
        </span>
      </button>

      {open ? (
        <div
          id={menuId}
          role="menu"
          aria-label={`Actions for ${title}`}
          className="absolute right-0 z-20 mt-1 min-w-[11rem] rounded-lg border border-border bg-surface py-1 shadow-md"
        >
          <MenuItem onClick={handleRename}>Rename</MenuItem>
          <div className="relative">
            <MenuItem
              onClick={() => setStatusOpen((value) => !value)}
              aria-haspopup="menu"
              aria-expanded={statusOpen}
            >
              Change status
            </MenuItem>
            {statusOpen ? (
              <div
                role="menu"
                className="absolute left-0 top-full z-30 mt-1 min-w-[10rem] rounded-lg border border-border bg-surface py-1 shadow-md sm:left-full sm:top-0 sm:mt-0 sm:ml-1"
              >
                {BOOK_STATUSES.map((value) => (
                  <MenuItem
                    key={value}
                    onClick={() => handleStatus(value)}
                    aria-checked={value === status}
                    role="menuitemradio"
                  >
                    {formatStatusLabel(value)}
                    {value === status ? ' ·' : ''}
                  </MenuItem>
                ))}
              </div>
            ) : null}
          </div>
          <MenuItem onClick={handleDelete} danger>
            Delete
          </MenuItem>
          <div className="my-1 border-t border-border" />
          <MenuItem disabled title="Coming in a later phase">
            Collections (soon)
          </MenuItem>
          <MenuItem disabled title="Coming in a later phase">
            Tags (soon)
          </MenuItem>
        </div>
      ) : null}

      {error ? (
        <p className="absolute right-0 top-full z-10 mt-1 whitespace-nowrap rounded-md bg-surface px-2 py-1 text-xs text-red-600 shadow">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function MenuItem({
  children,
  onClick,
  danger,
  disabled,
  title,
  role = 'menuitem',
  ...rest
}: {
  children: ReactNode;
  onClick?: () => void;
  danger?: boolean;
  disabled?: boolean;
  title?: string;
  role?: string;
  'aria-haspopup'?: 'menu';
  'aria-expanded'?: boolean;
  'aria-checked'?: boolean;
}) {
  return (
    <button
      type="button"
      role={role}
      title={title}
      disabled={disabled}
      className={`flex w-full px-3 py-2 text-left text-sm disabled:cursor-not-allowed disabled:opacity-50 ${
        danger ? 'text-red-600 hover:bg-red-500/10' : 'text-foreground hover:bg-tint-muted'
      }`}
      onClick={onClick}
      {...rest}
    >
      {children}
    </button>
  );
}
