export function BookSkeleton({ count = 6, layout = 'grid' }: { count?: number; layout?: 'grid' | 'list' }) {
  if (layout === 'list') {
    return (
      <div className="space-y-3" aria-busy="true" aria-label="Loading library">
        {Array.from({ length: count }).map((_, index) => (
          <div
            key={index}
            className="flex gap-4 rounded-xl border border-border bg-surface p-4"
          >
            <div className="h-28 w-20 shrink-0 animate-pulse rounded-lg bg-border/70" />
            <div className="flex-1 space-y-3 py-1">
              <div className="h-4 w-2/3 animate-pulse rounded bg-border/70" />
              <div className="h-3 w-1/3 animate-pulse rounded bg-border/50" />
              <div className="h-2 w-full animate-pulse rounded bg-border/40" />
              <div className="h-8 w-1/2 animate-pulse rounded bg-border/40" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3"
      aria-busy="true"
      aria-label="Loading library"
    >
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="rounded-xl border border-border bg-surface p-4">
          <div className="mb-3 h-36 w-full animate-pulse rounded-lg bg-border/70" />
          <div className="mb-2 h-4 w-4/5 animate-pulse rounded bg-border/70" />
          <div className="mb-4 h-3 w-1/2 animate-pulse rounded bg-border/50" />
          <div className="mb-2 flex gap-2">
            <div className="h-5 w-16 animate-pulse rounded bg-border/40" />
            <div className="h-5 w-14 animate-pulse rounded bg-border/40" />
          </div>
          <div className="h-2 w-full animate-pulse rounded bg-border/40" />
          <div className="mt-4 h-9 w-full animate-pulse rounded bg-border/40" />
        </div>
      ))}
    </div>
  );
}

export function BookDetailSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading book details">
      <div className="h-40 animate-pulse rounded-xl bg-border/50" />
      <div className="grid gap-4 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-4">
          <div className="h-48 animate-pulse rounded-xl bg-border/40" />
          <div className="h-40 animate-pulse rounded-xl bg-border/40" />
        </div>
        <div className="space-y-4">
          <div className="h-56 animate-pulse rounded-xl bg-border/40" />
          <div className="h-40 animate-pulse rounded-xl bg-border/40" />
        </div>
      </div>
    </div>
  );
}
