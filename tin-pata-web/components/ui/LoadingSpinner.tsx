interface LoadingSpinnerProps {
  label?: string;
}

export function LoadingSpinner({ label = 'Loading…' }: LoadingSpinnerProps) {
  return (
    <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted" role="status">
      <span
        className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-border border-t-tint"
        aria-hidden
      />
      <span>{label}</span>
    </div>
  );
}
