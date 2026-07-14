interface EmptyStateProps {
  title: string;
  description?: string;
  actionLabel?: string;
}

/** Reusable empty state for Library, Analytics, and dashboard cards. */
export function DashboardEmptyState({ title, description, actionLabel }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-background/60 px-4 py-10 text-center">
      <p className="text-sm font-medium text-foreground">{title}</p>
      {description ? <p className="max-w-sm text-sm text-muted">{description}</p> : null}
      {actionLabel ? (
        <p className="mt-2 text-xs font-medium text-tint">{actionLabel}</p>
      ) : null}
    </div>
  );
}
