interface AuthSuccessBannerProps {
  message: string | null;
}

export function AuthSuccessBanner({ message }: AuthSuccessBannerProps) {
  if (!message) {
    return null;
  }

  return (
    <div
      role="status"
      className="rounded-md border border-tint/30 bg-tint-muted px-3 py-2 text-sm text-foreground"
    >
      {message}
    </div>
  );
}
