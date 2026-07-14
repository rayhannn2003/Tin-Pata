import type { HTMLAttributes, ReactNode } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  muted?: boolean;
}

export function Card({ children, muted = false, className = '', ...props }: CardProps) {
  return (
    <div
      className={`rounded-lg border border-border p-4 shadow-sm ${muted ? 'bg-background' : 'bg-surface'} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
