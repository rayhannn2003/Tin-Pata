import type { ReactNode } from 'react';

interface AuthFooterProps {
  children: ReactNode;
}

export function AuthFooter({ children }: AuthFooterProps) {
  return <div className="mt-6 text-center text-sm text-muted">{children}</div>;
}
