import type { ReactNode } from 'react';

interface AuthCardProps {
  children: ReactNode;
}

export function AuthCard({ children }: AuthCardProps) {
  return (
    <div className="w-full rounded-xl border border-border bg-surface p-6 shadow-sm md:p-8">
      {children}
    </div>
  );
}
