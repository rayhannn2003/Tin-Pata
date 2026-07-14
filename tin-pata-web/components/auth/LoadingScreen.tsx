interface LoadingScreenProps {
  label?: string;
}

export function LoadingScreen({ label = 'Loading…' }: LoadingScreenProps) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3" role="status">
      <span
        className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-border border-t-tint"
        aria-hidden
      />
      <p className="text-sm text-muted">{label}</p>
    </div>
  );
}
