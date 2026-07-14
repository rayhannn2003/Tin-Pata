'use client';

interface ReaderLoadingProps {
  label?: string;
  percent?: number | null;
}

export function ReaderLoading({ label = 'Loading PDF…', percent = null }: ReaderLoadingProps) {
  return (
    <div
      className="flex h-full min-h-[50vh] flex-col items-center justify-center gap-4 bg-background px-6"
      aria-busy="true"
      aria-label={label}
    >
      <div className="h-10 w-48 animate-pulse rounded-lg bg-border/70" />
      <div className="h-[60%] w-full max-w-xl animate-pulse rounded-xl bg-border/50" />
      <p className="text-sm text-muted">
        {label}
        {percent != null ? ` ${Math.round(percent)}%` : ''}
      </p>
    </div>
  );
}
