'use client';

import { useEffect, useId, useState, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';

import { LoadingScreen } from '@/components/auth/LoadingScreen';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { Topbar } from '@/components/dashboard/Topbar';
import { useAuth } from '@/hooks/useAuth';

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { loading, authenticated } = useAuth();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const drawerTitleId = useId();
  const isReaderRoute = pathname.startsWith('/dashboard/reader');

  useEffect(() => {
    if (!mobileOpen) {
      return;
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setMobileOpen(false);
      }
    }
    document.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  if (loading) {
    return <LoadingScreen label="Restoring session…" />;
  }

  if (!authenticated) {
    return <LoadingScreen label="Redirecting to sign in…" />;
  }

  // Immersive reading chrome — dashboard nav would compete with reader sidebars.
  if (isReaderRoute) {
    return <div className="h-dvh overflow-hidden bg-background">{children}</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="fixed inset-y-0 left-0 z-40 hidden lg:block">
        <Sidebar />
      </div>

      {mobileOpen ? (
        <div
          className="fixed inset-0 z-50 lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-labelledby={drawerTitleId}
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label="Close navigation menu"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 flex w-[min(18rem,85vw)] flex-col shadow-lg">
            <p id={drawerTitleId} className="sr-only">
              Navigation menu
            </p>
            <Sidebar onNavigate={() => setMobileOpen(false)} className="h-full" />
          </div>
        </div>
      ) : null}

      <div className="lg:pl-64">
        <Topbar onOpenSidebar={() => setMobileOpen(true)} />
        <main className="px-4 py-6 md:px-6 md:py-8">{children}</main>
      </div>
    </div>
  );
}
